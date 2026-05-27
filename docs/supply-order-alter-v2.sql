-- ============================================================
-- supply-order ALTER v2
-- 1. item_master.ingredient  : text → text[]  (성분명 복수 지원)
-- 2. item_products.item_master_id : NOT NULL → nullable (대량 업로드 후 연결)
-- Supabase SQL Editor에 붙여넣기 후 실행
-- ============================================================

-- 1. ingredient 컬럼: text → text[]
--    기존 데이터가 있으면 ARRAY로 감싸서 보존, NULL은 빈 배열로
ALTER TABLE item_master
  ALTER COLUMN ingredient TYPE text[]
  USING CASE
    WHEN ingredient IS NULL THEN '{}'::text[]
    ELSE ARRAY[ingredient]
  END;

ALTER TABLE item_master
  ALTER COLUMN ingredient SET DEFAULT '{}';

ALTER TABLE item_master
  ALTER COLUMN ingredient SET NOT NULL;

COMMENT ON COLUMN item_master.ingredient IS '성분명 배열 — 복수 성분 지원 (예: ["Amoxicillin", "Clavulanate"]). AI 매핑·검색에 활용';


-- 2. item_products.item_master_id: NOT NULL 제거 (대량 업로드 후 연결)
ALTER TABLE item_products
  ALTER COLUMN item_master_id DROP NOT NULL;

COMMENT ON COLUMN item_products.item_master_id IS '품목 마스터 FK — 대량 업로드 후 연결 가능 (NULL 허용)';
