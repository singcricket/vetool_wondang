-- ============================================================
-- 동물병원 물품 주문/재고 관리 — DB Migration
-- 작성일: 2026-05-25
-- Supabase SQL Editor 에 전체 복사 후 한 번에 실행
--
-- 실행 순서:
--   0. 유틸 함수 (get_my_hos_id, update_updated_at)
--   1. vendors
--   2. item_master
--   3. item_products
--   4. item_vendor_mappings
--   5. orders
--   6. order_items
--   7. deliveries
--   8. delivery_items
--   9. inventory_logs
--  10. VIEW current_inventory
--  11. 인덱스
--  12. RLS + 정책
--  13. updated_at 트리거
-- ============================================================


-- ============================================================
-- 0. 유틸 함수
-- ============================================================

-- 현재 로그인 유저의 병원 ID 반환 (이미 존재하면 교체)
CREATE OR REPLACE FUNCTION get_my_hos_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT hos_id FROM users WHERE user_id = auth.uid()
$$;

-- updated_at 자동 갱신 트리거 함수 (이미 존재하면 교체)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- 1. vendors — 도매상
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id               uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,

  name                 text        NOT NULL,
  categories           text[]      NOT NULL DEFAULT '{}',   -- ['의약품','의료소모품',...]
  representative       text,                                -- 대표자명
  representative_phone text,                                -- 대표 연락처

  -- [{name: '홍길동', phone: '010-0000-0000', memo: ''}]
  contacts             jsonb       NOT NULL DEFAULT '[]',

  address              text,
  memo                 text,
  is_active            boolean     NOT NULL DEFAULT true,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  vendors          IS '도매상/공급업체 정보';
COMMENT ON COLUMN vendors.contacts IS '[{name, phone, memo}] 담당자 목록';


-- ============================================================
-- 2. item_master — 동물병원 표준 품목
--    브랜드·제조사 무관, 병원이 직접 정의하는 기준 품목
--    예) "N/S 500mL", "아목시실린 250mg 캡슐"
-- ============================================================
CREATE TABLE IF NOT EXISTS item_master (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id       uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,

  -- 권장 카테고리: 주사제 / 수액제 / 경구제 / 안약·연고 /
  --               의료소모품 / 검사소모품 / 진단키트 / 장비소모품 / 기타
  category     text        NOT NULL,
  generic_name text        NOT NULL,   -- 성분명/기준명 (병원에서 부르는 이름)
  description  text,                   -- 추가 설명, 용도, 주의사항

  base_unit    text        NOT NULL DEFAULT '개',   -- 재고 집계 기준 최소 단위

  -- 별칭: ['생리적식염수 500ml', 'NS500', '0.9% NaCl 500']
  -- AI 매핑 및 검색에 활용
  aliases      text[]      NOT NULL DEFAULT '{}',

  -- 재고 임계값
  alert_min_stock  numeric NOT NULL DEFAULT 0 CHECK (alert_min_stock >= 0),
  reorder_qty      numeric NOT NULL DEFAULT 0 CHECK (reorder_qty     >= 0),

  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  item_master                 IS '동물병원 표준 품목 마스터 (브랜드·제조사 무관)';
COMMENT ON COLUMN item_master.base_unit       IS '재고 집계 기준 최소 단위 (팩, 개, 바이알, 정 등)';
COMMENT ON COLUMN item_master.aliases         IS '별칭 목록 — AI 매핑·검색에 사용';
COMMENT ON COLUMN item_master.alert_min_stock IS '이 수량 이하 시 재고 부족 경고';
COMMENT ON COLUMN item_master.reorder_qty     IS '발주 권장 수량 (참고용)';


-- ============================================================
-- 3. item_products — 실제 유통 제품 (제품 카탈로그)
--    같은 표준 품목이라도 제조사·규격별로 개별 1회 등록
--    납품마다 새로 등록하는 것이 아님
-- ============================================================
CREATE TABLE IF NOT EXISTS item_products (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id          uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  item_master_id  uuid        NOT NULL REFERENCES item_master(id)   ON DELETE RESTRICT,

  brand_name      text        NOT NULL,   -- 제품명/상품명 (JW 생리식염수 500mL)
  manufacturer    text,                   -- 제조사 (JW중외제약)
  ingredient      text,                   -- 세부 성분 (복합제 등, nullable)
  specification   text,                   -- 규격 (500mL, 250mg/5mL 등)

  -- 납품 포장 단위 → 기준단위 환산
  -- 박스 1개 = 팩 100개: package_type='박스', units_per_package=100
  package_type       text    NOT NULL DEFAULT '낱개',
  units_per_package  integer NOT NULL DEFAULT 1 CHECK (units_per_package > 0),

  -- 기준 단가 참고값 (실제 납품가는 delivery_items.unit_price)
  reference_price    numeric CHECK (reference_price >= 0),

  memo       text,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  item_products                   IS '실제 유통 제품 카탈로그 (제조사·브랜드별, 제품당 1회 등록)';
COMMENT ON COLUMN item_products.units_per_package IS '포장 1개당 base_unit 수량. 박스=100팩이면 100';
COMMENT ON COLUMN item_products.ingredient        IS '세부 성분명 (복합제 등, 선택 입력)';
COMMENT ON COLUMN item_products.reference_price   IS '기준 단가 참고값. 실제 납품가는 delivery_items.unit_price';


-- ============================================================
-- 4. item_vendor_mappings — 도매상 품목명 학습 매핑
--    "A약품 납품서의 JW NS 500" → item_products.id
--    유저 1회 승인 후 저장 → 이후 자동 매핑 (AI 재호출 불필요)
-- ============================================================
CREATE TABLE IF NOT EXISTS item_vendor_mappings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id          uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  item_product_id uuid        NOT NULL REFERENCES item_products(id) ON DELETE CASCADE,
  vendor_id       uuid        NOT NULL REFERENCES vendors(id)       ON DELETE CASCADE,

  vendor_item_name text       NOT NULL,   -- 도매상 문서의 실제 품목 표기명
  vendor_item_spec text,                  -- 규격 표기 (도매상 문서 원문)

  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (hos_id, vendor_id, vendor_item_name)
);

COMMENT ON TABLE item_vendor_mappings IS
  '도매상별 품목 표기명 → item_products 매핑 학습. 승인 1회 후 자동 적용';


-- ============================================================
-- 5. orders — 주문서 헤더
--
-- 담당자:
--   order_handler_id — 병원 측 주문 담당자 (실제로 전화·주문한 직원, UUID)
--   vendor_contact   — 도매상 측 담당자명 (전화 받은 사람, text 자유 입력)
--   created_by       — 시스템 문서 작성자 (UUID)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id     uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  vendor_id  uuid        NOT NULL REFERENCES vendors(id)       ON DELETE RESTRICT,

  order_date date        NOT NULL DEFAULT CURRENT_DATE,

  -- draft(작성중) → ordered(주문완료/전화접수) → confirmed(도매상확인)
  -- → delivering(배송중) → delivered(납품완료) | partial(부분납품)
  -- → returned(반품) | rejected(반려) | cancelled(취소)
  status     text        NOT NULL DEFAULT 'draft'
               CHECK (status IN (
                 'draft','ordered','confirmed','delivering',
                 'delivered','partial','returned','rejected','cancelled'
               )),

  order_handler_id  uuid REFERENCES users(user_id) ON DELETE SET NULL,
  vendor_contact    text,

  memo        text,
  created_by  uuid        REFERENCES users(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  orders                  IS '주문서 헤더. 도매상별 개별 작성';
COMMENT ON COLUMN orders.order_handler_id IS '병원 측 주문 담당자 (users UUID)';
COMMENT ON COLUMN orders.vendor_contact   IS '도매상 측 주문 접수 담당자명 (자유 입력)';
COMMENT ON COLUMN orders.created_by       IS '시스템 문서 작성자 (users UUID)';


-- ============================================================
-- 6. order_items — 주문 품목 (orders 1:N)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid        NOT NULL REFERENCES orders(id)      ON DELETE CASCADE,
  item_master_id uuid        NOT NULL REFERENCES item_master(id) ON DELETE RESTRICT,

  quantity             numeric NOT NULL CHECK (quantity > 0),
  unit                 text    NOT NULL,   -- 주문 단위 (팩, 박스, 개...)
  units_per_order_unit integer NOT NULL DEFAULT 1 CHECK (units_per_order_unit > 0),

  unit_price  numeric     CHECK (unit_price >= 0),
  memo        text,

  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_items IS '주문 품목. 표준 품목(item_master) 기준으로 연결';


-- ============================================================
-- 7. deliveries — 납품 확인서 헤더
--    주문서 없이 납품되는 경우도 있어 order_id nullable
--
-- 담당자:
--   received_by      — 병원 측 수령·검수 담당자 (UUID)
--   vendor_deliverer — 도매상 측 납품 담당자명 (text 자유 입력)
--   confirmed_by     — 병원 측 최종 확인·승인자 (UUID)
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id        uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  vendor_id     uuid        NOT NULL REFERENCES vendors(id)       ON DELETE RESTRICT,
  order_id      uuid        REFERENCES orders(id) ON DELETE SET NULL,  -- nullable

  delivery_date date        NOT NULL DEFAULT CURRENT_DATE,

  -- pending(확인대기) → reviewing(검토중) → confirmed(확인완료)
  -- partial(부분확인) | returned(반품처리)
  status        text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','reviewing','confirmed','partial','returned')),

  source_type     text      DEFAULT 'manual'
                    CHECK (source_type IN ('manual','excel','image')),
  source_file_url text,     -- Storage 업로드 원본 파일 URL

  -- 병원 측 수령·검수 담당자
  received_by      uuid     REFERENCES users(user_id) ON DELETE SET NULL,
  -- 도매상 측 납품 담당자명 (자유 입력)
  vendor_deliverer text,
  -- 병원 측 최종 확인·승인자
  confirmed_by     uuid     REFERENCES users(user_id) ON DELETE SET NULL,
  confirmed_at     timestamptz,

  memo        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  deliveries                  IS '납품 확인서 헤더';
COMMENT ON COLUMN deliveries.received_by      IS '병원 측 수령·검수 담당자 (users UUID)';
COMMENT ON COLUMN deliveries.vendor_deliverer IS '도매상 측 납품 담당자명 (자유 입력)';
COMMENT ON COLUMN deliveries.confirmed_by     IS '병원 측 최종 승인자 (수령자와 다를 수 있음)';


-- ============================================================
-- 8. delivery_items — 납품 품목 (deliveries 1:N)
--    유통기한·로트번호는 납품 배치마다 다를 수 있어 여기에 저장
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id      uuid        NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,

  -- 문서 원본 텍스트 (엑셀 셀값 또는 OCR 결과 그대로 보존)
  raw_name         text        NOT NULL,
  raw_spec         text,
  raw_manufacturer text,
  raw_quantity     text,    -- 원문 수량 표기 (파싱 전)

  -- 매핑 결과 (유저 승인 후 채워짐)
  item_product_id  uuid        REFERENCES item_products(id) ON DELETE SET NULL,
  item_master_id   uuid        REFERENCES item_master(id)   ON DELETE SET NULL,

  quantity_received   numeric  NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit                text     NOT NULL DEFAULT '개',
  units_per_package   integer  NOT NULL DEFAULT 1 CHECK (units_per_package > 0),

  -- 기준단위 환산 수량 (자동 계산)
  base_quantity numeric GENERATED ALWAYS AS (quantity_received * units_per_package) STORED,

  unit_price  numeric     CHECK (unit_price >= 0),

  -- 이 납품 배치 고유 정보
  expiry_date  date,    -- 유통기한 (nullable)
  lot_number   text,    -- 로트번호 (nullable)

  -- pending      : 미매핑 초기 상태
  -- ai_suggested : AI 제안 — 유저 승인 대기
  -- mapped        : 매핑 완료
  -- new_product  : 신규 제품 등록 필요
  -- skipped      : 품목 아닌 행 (비고 등)
  mapping_status     text        NOT NULL DEFAULT 'pending'
                       CHECK (mapping_status IN (
                         'pending','ai_suggested','mapped','new_product','skipped'
                       )),
  mapping_confidence numeric     CHECK (mapping_confidence BETWEEN 0 AND 1),

  -- {item_master_id, item_product_id, reason, alternatives:[...]}
  ai_suggestion  jsonb,

  memo        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  delivery_items              IS '납품 품목. AI 매핑 결과·승인 상태·유통기한 포함';
COMMENT ON COLUMN delivery_items.base_quantity IS 'quantity_received × units_per_package (GENERATED)';
COMMENT ON COLUMN delivery_items.expiry_date   IS '이 배치의 유통기한 (동일 제품이라도 납품마다 다름)';
COMMENT ON COLUMN delivery_items.lot_number    IS '이 배치의 로트번호 (선택)';


-- ============================================================
-- 9. inventory_logs — 재고 입출고 이력 (Ledger)
--    수량을 직접 저장하지 않고 이력을 쌓아 집계
--    현재재고 = SUM(quantity) per item_master_id
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id         uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  item_master_id uuid        NOT NULL REFERENCES item_master(id)   ON DELETE RESTRICT,

  -- IN(입고) / OUT(출고) / ADJUST(수동조정) / EXPIRED(유효기간만료) / RETURNED(반품차감)
  transaction_type text       NOT NULL
                     CHECK (transaction_type IN ('IN','OUT','ADJUST','EXPIRED','RETURNED')),

  -- 입고·조정증가: 양수 / 출고·조정감소·만료·반품: 음수
  quantity   numeric         NOT NULL,
  base_unit  text            NOT NULL,

  reference_type  text  CHECK (reference_type IN ('delivery','order','manual','adjustment')),
  reference_id    uuid,   -- delivery_items.id 또는 기타

  memo        text,
  -- 병원 측 입출고 기록 담당자
  created_by  uuid        REFERENCES users(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  inventory_logs            IS '재고 이력 원장. 현재 재고는 current_inventory 뷰 조회';
COMMENT ON COLUMN inventory_logs.quantity   IS '입고·증가: 양수 / 출고·감소: 음수 (base_unit 기준)';
COMMENT ON COLUMN inventory_logs.created_by IS '병원 측 입출고 기록 담당자 (users UUID)';


-- ============================================================
-- 10. VIEW: current_inventory — 현재 재고 + 부족 여부
-- ============================================================
CREATE OR REPLACE VIEW current_inventory AS
SELECT
  il.hos_id,
  il.item_master_id,
  im.category,
  im.generic_name,
  im.base_unit,
  im.alert_min_stock,
  im.reorder_qty,
  im.is_active,
  COALESCE(SUM(il.quantity), 0)                       AS current_stock,
  COALESCE(SUM(il.quantity), 0) <= im.alert_min_stock AS is_low_stock,
  MAX(il.created_at)                                  AS last_transaction_at
FROM inventory_logs il
JOIN item_master     im ON im.id = il.item_master_id
GROUP BY
  il.hos_id, il.item_master_id,
  im.category, im.generic_name, im.base_unit,
  im.alert_min_stock, im.reorder_qty, im.is_active;

COMMENT ON VIEW current_inventory IS
  '품목별 현재 재고 + 재고 부족 여부. 상세 이력은 inventory_logs 직접 조회';


-- ============================================================
-- 11. 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vendors_hos
  ON vendors (hos_id);

CREATE INDEX IF NOT EXISTS idx_item_master_hos
  ON item_master (hos_id);
CREATE INDEX IF NOT EXISTS idx_item_master_category
  ON item_master (hos_id, category);

CREATE INDEX IF NOT EXISTS idx_item_products_master
  ON item_products (item_master_id);
CREATE INDEX IF NOT EXISTS idx_item_products_hos
  ON item_products (hos_id);

CREATE INDEX IF NOT EXISTS idx_vendor_mappings_lookup
  ON item_vendor_mappings (hos_id, vendor_id, vendor_item_name);

CREATE INDEX IF NOT EXISTS idx_orders_hos_date
  ON orders (hos_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vendor
  ON orders (vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_handler
  ON orders (order_handler_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_hos_date
  ON deliveries (hos_id, delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_order
  ON deliveries (order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_received_by
  ON deliveries (received_by);

CREATE INDEX IF NOT EXISTS idx_delivery_items_delivery
  ON delivery_items (delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_items_expiry
  ON delivery_items (expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_items_mapping
  ON delivery_items (mapping_status) WHERE mapping_status != 'mapped';

CREATE INDEX IF NOT EXISTS idx_inventory_logs_master
  ON inventory_logs (hos_id, item_master_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_ref
  ON inventory_logs (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_handler
  ON inventory_logs (created_by);


-- ============================================================
-- 12. RLS + 정책
-- ============================================================
ALTER TABLE vendors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_master          ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_vendor_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs       ENABLE ROW LEVEL SECURITY;

-- ── vendors ─────────────────────────────────────────────────
CREATE POLICY "vendors_select" ON vendors
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());
CREATE POLICY "vendors_insert" ON vendors
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "vendors_update" ON vendors
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "vendors_delete" ON vendors
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── item_master ──────────────────────────────────────────────
CREATE POLICY "item_master_select" ON item_master
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());
CREATE POLICY "item_master_insert" ON item_master
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "item_master_update" ON item_master
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "item_master_delete" ON item_master
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── item_products ────────────────────────────────────────────
CREATE POLICY "item_products_select" ON item_products
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());
CREATE POLICY "item_products_insert" ON item_products
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "item_products_update" ON item_products
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "item_products_delete" ON item_products
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── item_vendor_mappings ─────────────────────────────────────
CREATE POLICY "item_vendor_mappings_select" ON item_vendor_mappings
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());
CREATE POLICY "item_vendor_mappings_insert" ON item_vendor_mappings
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "item_vendor_mappings_update" ON item_vendor_mappings
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "item_vendor_mappings_delete" ON item_vendor_mappings
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── orders ───────────────────────────────────────────────────
CREATE POLICY "orders_select" ON orders
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());
CREATE POLICY "orders_insert" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "orders_update" ON orders
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "orders_delete" ON orders
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── order_items (orders 를 통해 병원 확인) ───────────────────
CREATE POLICY "order_items_select" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.hos_id = get_my_hos_id()
    )
  );
CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.hos_id = get_my_hos_id()
    )
  );
CREATE POLICY "order_items_update" ON order_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.hos_id = get_my_hos_id()
    )
  );
CREATE POLICY "order_items_delete" ON order_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.hos_id = get_my_hos_id()
    )
  );

-- ── deliveries ───────────────────────────────────────────────
CREATE POLICY "deliveries_select" ON deliveries
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());
CREATE POLICY "deliveries_insert" ON deliveries
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "deliveries_update" ON deliveries
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "deliveries_delete" ON deliveries
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── delivery_items (deliveries 를 통해 병원 확인) ────────────
CREATE POLICY "delivery_items_select" ON delivery_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.id = delivery_items.delivery_id
        AND d.hos_id = get_my_hos_id()
    )
  );
CREATE POLICY "delivery_items_insert" ON delivery_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.id = delivery_items.delivery_id
        AND d.hos_id = get_my_hos_id()
    )
  );
CREATE POLICY "delivery_items_update" ON delivery_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.id = delivery_items.delivery_id
        AND d.hos_id = get_my_hos_id()
    )
  );
CREATE POLICY "delivery_items_delete" ON delivery_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.id = delivery_items.delivery_id
        AND d.hos_id = get_my_hos_id()
    )
  );

-- ── inventory_logs ───────────────────────────────────────────
CREATE POLICY "inventory_logs_select" ON inventory_logs
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());
CREATE POLICY "inventory_logs_insert" ON inventory_logs
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "inventory_logs_update" ON inventory_logs
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());
CREATE POLICY "inventory_logs_delete" ON inventory_logs
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());


-- ============================================================
-- 13. updated_at 트리거 연결
-- ============================================================
CREATE TRIGGER trg_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_item_master_updated_at
  BEFORE UPDATE ON item_master
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_item_products_updated_at
  BEFORE UPDATE ON item_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_delivery_items_updated_at
  BEFORE UPDATE ON delivery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 완료
-- ============================================================
-- 생성된 테이블:
--   vendors, item_master, item_products, item_vendor_mappings,
--   orders, order_items, deliveries, delivery_items, inventory_logs
-- 생성된 뷰:
--   current_inventory
-- 인덱스: 18개
-- RLS 정책: 테이블당 SELECT/INSERT/UPDATE/DELETE 4개 (총 36개)
-- 트리거: 6개 (updated_at 자동 갱신)
