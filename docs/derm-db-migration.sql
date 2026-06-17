-- ============================================================
-- 수의 피부과 차트 시스템 — DB Migration
-- 작성일: 2026-06-17
-- Supabase SQL Editor에서 순서대로 실행
--
-- 테이블 구성:
--   1. derm_charts         — 방문 단위 차트 (초진/재진)
--   2. derm_lesion_groups  — 병변 그룹 (환자 단위로 지속, 초진에서 생성)
--   3. derm_lesion_visits  — 방문별 병변 소견 (그룹 × 방문)
--   4. derm_images         — 이미지 (전체사진/세부사진)
--
-- 관계:
--   patients ─< derm_charts ─< derm_lesion_groups ─< derm_lesion_visits
--                           └─< derm_images
--                                         └─< derm_images (세부사진)
--
-- Storage bucket: derm-images (별도 생성 필요)
-- ============================================================


-- ============================================================
-- 1. derm_charts — 방문 단위 차트
-- ============================================================
-- 매 방문(초진/재진)마다 1개 생성.
-- 초진: visit_type = 'initial', 전체사진 + 병변그룹 생성
-- 재진: visit_type = 'followup', 기존 그룹에 세부사진 + 소견만 추가

CREATE TABLE derm_charts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id              uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  patient_id          uuid        NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,

  chart_date          date        NOT NULL DEFAULT CURRENT_DATE,
  visit_type          text        NOT NULL DEFAULT 'initial'
                                  CHECK (visit_type IN ('initial', 'followup')),

  -- 주증상 (자유 텍스트, 구어체 허용)
  chief_complaint     text,

  -- 전체 사진 URL (전신 촬영 — 병변 위치 파악용)
  overview_image_url  text,

  -- AI 산정 전체 심각도 (1=경미 2=중등도 3=중증 4=매우중증)
  overall_severity    smallint    CHECK (overall_severity BETWEEN 1 AND 4),

  -- AI 전체 판독 요약 (모든 그룹 통합)
  ai_summary          text,

  -- 자유 소견 (수의사 메모)
  notes               text,

  -- 담당자
  evaluator_id        uuid        REFERENCES users(user_id) ON DELETE SET NULL,
  vet_id              uuid        REFERENCES users(user_id) ON DELETE SET NULL,

  user_tags           text,       -- 쉼표 구분 태그

  created_at          timestamptz DEFAULT NOW(),
  updated_at          timestamptz DEFAULT NOW()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_derm_charts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_derm_charts_updated_at
  BEFORE UPDATE ON derm_charts
  FOR EACH ROW EXECUTE FUNCTION update_derm_charts_updated_at();


-- ============================================================
-- 2. derm_lesion_groups — 병변 그룹
-- ============================================================
-- 초진 시 생성. 이후 재진에서도 동일 그룹을 참조.
-- 한 환자의 모든 방문에 걸쳐 유지됨.
--
-- marker_data JSONB 구조 (전체사진 위의 마커, 정규화 좌표 0.0~1.0):
-- [
--   { "type": "point", "x": 0.45, "y": 0.32, "number": 1 },
--   { "type": "area",  "x": 0.30, "y": 0.20, "width": 0.20, "height": 0.15, "number": 2 }
-- ]

CREATE TABLE derm_lesion_groups (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id              uuid        NOT NULL,
  patient_id          uuid        NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,

  -- 이 그룹이 처음 생성된 방문
  initial_chart_id    uuid        NOT NULL REFERENCES derm_charts(id) ON DELETE CASCADE,

  -- 그룹 식별자 (자동 부여: A, B, C... 또는 수동 입력)
  group_label         text        NOT NULL,

  -- UI 표시 색상 (hex: '#ef4444')
  group_color         text,

  -- 수의사 또는 AI가 추정한 병변 종류
  -- 예: 'pustule', 'erythema', 'alopecia', 'papule', 'nodule' 등
  suspected_type      text,

  -- 전체 사진 위의 마커 좌표 (위 JSONB 구조 참고)
  marker_data         jsonb,

  -- 그룹 상태: active(진행중) → resolved(소실/완치)
  status              text        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'resolved')),

  created_at          timestamptz DEFAULT NOW()
);


-- ============================================================
-- 3. derm_lesion_visits — 방문별 병변 소견
-- ============================================================
-- 각 방문(chart)에서 각 병변 그룹(lesion_group)에 대한 소견.
-- 한 방문에서 한 그룹당 1개 행 (UNIQUE 제약).
--
-- improvement 기준:
--   worsened         → 🔴 악화
--   unchanged        → 🟠 변화없음
--   mild_improvement → 🟡 경미한 호전
--   improved         → 🟢 호전
--   resolved         → ✅ 완치
--
-- ai_analysis JSONB 구조 (Claude 출력):
-- {
--   "lesion_type": ["pustule"],
--   "anatomical_location": "좌측 액와부",
--   "description": "다발성 농포, 중앙 농성 내용물",
--   "confidence": 0.82,
--   "severity": 2,
--   "differential": ["superficial_pyoderma", "folliculitis"],
--   "recommended_tests": ["tape_strip", "skin_scraping"],
--   "immediate_action": "2차 감염 범위 확인, 항소양제 고려"
-- }

CREATE TABLE derm_lesion_visits (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id                uuid        NOT NULL,   -- RLS용 비정규화
  chart_id              uuid        NOT NULL REFERENCES derm_charts(id) ON DELETE CASCADE,
  lesion_group_id       uuid        NOT NULL REFERENCES derm_lesion_groups(id) ON DELETE CASCADE,

  -- 구어체 입력 (수의사가 편한 말로 입력)
  -- 예: "겨드랑이에 가운데 농이 진 동그란 병변이 여러개 보여"
  raw_input             text,

  -- AI 변환 정식 용어
  -- 예: "액와부 다발성 농포. 원형, 중앙 농성 내용물 함유, 직경 약 2-4mm 추정"
  formal_findings       text,

  -- 병변 종류 목록 (AI 판독 또는 수의사 확인)
  lesion_types          jsonb,      -- ["pustule", "papule"]

  -- Claude 전체 출력 (위 JSONB 구조 참고)
  ai_analysis           jsonb,

  -- 이번 방문 심각도
  severity              smallint    CHECK (severity BETWEEN 1 AND 4),

  -- 이전 방문 대비 호전도 (초진은 NULL)
  improvement           text        CHECK (improvement IN (
                                      'worsened', 'unchanged', 'mild_improvement',
                                      'improved', 'resolved'
                                    )),

  -- AI 이전 방문 대비 비교 소견 텍스트
  ai_comparison_notes   text,

  created_at            timestamptz DEFAULT NOW(),

  -- 한 방문에서 동일 그룹은 1개 소견만
  UNIQUE (chart_id, lesion_group_id)
);


-- ============================================================
-- 4. derm_images — 이미지
-- ============================================================
-- image_type:
--   overview → 전체 사진 (chart 단위, lesion_group_id = NULL)
--   detail   → 세부 사진 (특정 그룹에 속함)

CREATE TABLE derm_images (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id              uuid        NOT NULL,
  chart_id            uuid        NOT NULL REFERENCES derm_charts(id) ON DELETE CASCADE,

  -- 세부사진이면 연결된 그룹 ID, 전체사진이면 NULL
  lesion_group_id     uuid        REFERENCES derm_lesion_groups(id) ON DELETE SET NULL,

  image_type          text        NOT NULL DEFAULT 'detail'
                                  CHECK (image_type IN ('overview', 'detail')),

  image_url           text        NOT NULL,

  -- 그룹 내 순서
  sort_order          smallint    DEFAULT 0,

  created_at          timestamptz DEFAULT NOW()
);


-- ============================================================
-- 인덱스
-- ============================================================

-- derm_charts
CREATE INDEX idx_derm_charts_patient       ON derm_charts(patient_id);
CREATE INDEX idx_derm_charts_hos_date      ON derm_charts(hos_id, chart_date DESC);

-- derm_lesion_groups
CREATE INDEX idx_derm_lesion_groups_patient      ON derm_lesion_groups(patient_id);
CREATE INDEX idx_derm_lesion_groups_init_chart   ON derm_lesion_groups(initial_chart_id);

-- derm_lesion_visits
CREATE INDEX idx_derm_lesion_visits_chart        ON derm_lesion_visits(chart_id);
CREATE INDEX idx_derm_lesion_visits_group        ON derm_lesion_visits(lesion_group_id);

-- derm_images
CREATE INDEX idx_derm_images_chart               ON derm_images(chart_id);
CREATE INDEX idx_derm_images_group               ON derm_images(lesion_group_id);


-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
-- get_my_hos_id() 함수 기존 사용 패턴 동일

ALTER TABLE derm_charts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE derm_lesion_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE derm_lesion_visits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE derm_images         ENABLE ROW LEVEL SECURITY;

-- ── derm_charts ──────────────────────────────────────────────

CREATE POLICY "derm_charts_select" ON derm_charts
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());

CREATE POLICY "derm_charts_insert" ON derm_charts
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "derm_charts_update" ON derm_charts
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "derm_charts_delete" ON derm_charts
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── derm_lesion_groups ───────────────────────────────────────

CREATE POLICY "derm_lesion_groups_select" ON derm_lesion_groups
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());

CREATE POLICY "derm_lesion_groups_insert" ON derm_lesion_groups
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "derm_lesion_groups_update" ON derm_lesion_groups
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "derm_lesion_groups_delete" ON derm_lesion_groups
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── derm_lesion_visits ───────────────────────────────────────

CREATE POLICY "derm_lesion_visits_select" ON derm_lesion_visits
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());

CREATE POLICY "derm_lesion_visits_insert" ON derm_lesion_visits
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "derm_lesion_visits_update" ON derm_lesion_visits
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "derm_lesion_visits_delete" ON derm_lesion_visits
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());

-- ── derm_images ──────────────────────────────────────────────

CREATE POLICY "derm_images_select" ON derm_images
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());

CREATE POLICY "derm_images_insert" ON derm_images
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "derm_images_update" ON derm_images
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "derm_images_delete" ON derm_images
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());


-- ============================================================
-- Storage bucket 설정 (Supabase Dashboard에서 별도 생성)
-- ============================================================
-- Bucket name : derm-images
-- Public      : false (signed URL 방식)
-- 아래 Storage Policy를 SQL Editor에서 실행
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('derm-images', 'derm-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "derm_images_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'derm-images'
    AND (storage.foldername(name))[1] = get_my_hos_id()::text
  );

CREATE POLICY "derm_images_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'derm-images'
    AND (storage.foldername(name))[1] = get_my_hos_id()::text
  );

CREATE POLICY "derm_images_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'derm-images'
    AND (storage.foldername(name))[1] = get_my_hos_id()::text
  );


-- ============================================================
-- 설계 메모
-- ============================================================
--
-- [병변 그룹의 수명]
--   초진에서 derm_lesion_groups 생성.
--   재진에서는 기존 그룹을 참조해 derm_lesion_visits 행만 추가.
--   그룹이 소실되면 status = 'resolved'로 변경 (삭제 금지 — 이력 보존).
--
-- [재진 호전도 조회 예시]
--   SELECT
--     lg.group_label,
--     lv.chart_id,
--     dc.chart_date,
--     lv.severity,
--     lv.improvement,
--     lv.formal_findings
--   FROM derm_lesion_groups lg
--   JOIN derm_lesion_visits lv ON lv.lesion_group_id = lg.id
--   JOIN derm_charts dc ON dc.id = lv.chart_id
--   WHERE lg.patient_id = '<patient_id>'
--   ORDER BY lg.group_label, dc.chart_date;
--
-- [marker_data 좌표계]
--   x, y, width, height 모두 0.0~1.0 정규화 값.
--   overview_image 실제 픽셀 크기에 곱해서 렌더링.
--   point  → { type, x, y, number }
--   area   → { type, x, y, width, height, number }
--
-- [향후 확장 고려]
--   - derm_prescriptions 테이블: 처방 연동 (plan에서 언급)
--   - derm_schematic_marks: 피부 모식도 마킹 (3-8절, 구현 시)
--   - lesion_types enum 테이블: 병변 종류 표준화
-- ============================================================
