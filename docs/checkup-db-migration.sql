-- ============================================================
-- 건강검진 플랫폼 — DB Migration
-- 최초 작성: 2026-05-21
-- Supabase SQL Editor에서 순서대로 실행
--
-- 테이블 구성:
--   1. checkup_records    — 검진 메타 (상태, 담당 수의사, 서브차트 참조)
--   2. checkup_sections   — 섹션별 데이터 (JSONB)
--   3. checkup_images     — 이미지 + AI 자동 분류
--   4. checkup_ai_results — AI 종합소견 + 승인 정보
--
-- 공유: 기존 resource_shares 시스템 사용 (resource_type = 'checkup')
-- ============================================================



-- ============================================================
-- 1. checkup_records — 검진 마스터
-- ============================================================
CREATE TABLE checkup_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id          uuid NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  patient_id      uuid NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,

  checkup_date    date NOT NULL DEFAULT CURRENT_DATE,

  -- 상태: draft(작성중) → reviewing(검토중) → approved(승인완료)
  -- approved 상태에서만 리포트 공유 링크 생성 가능
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'reviewing', 'approved')),

  -- 담당 수의사 / 작성자
  vet_id          uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_by      uuid REFERENCES users(user_id) ON DELETE SET NULL,

  -- 연동된 서브차트 ID 참조
  -- {
  --   dental_id:     uuid | null,
  --   echo_id:       uuid | null,
  --   ultrasound_id: uuid | null,
  --   neuro_id:      uuid | null,
  --   ophthalmic_id: uuid | null
  -- }
  sub_charts      jsonb NOT NULL DEFAULT '{}',

  notes           text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkup_records_hos_id       ON checkup_records(hos_id);
CREATE INDEX idx_checkup_records_patient_id   ON checkup_records(patient_id);
CREATE INDEX idx_checkup_records_checkup_date ON checkup_records(checkup_date);
CREATE INDEX idx_checkup_records_status       ON checkup_records(status);


-- ============================================================
-- 2. checkup_sections — 섹션별 입력 데이터
--
-- section_type:
--   'inquiry'    — 문진 (주증상, 병력, 생활환경, 현재 약물)
--   'physical'   — 신체검사 (일반, 신경계, 관절, 안과)
--   'lab'        — 임상병리 (혈액, 특수, 내분비, 요검사, 체강액)
--   'imaging'    — 영상검사 (방사선, 초음파, 내시경, CT, MRI)
--   'assessment' — 평가 (문제목록, 진단, 감별진단)
--   'plan'       — 계획 (치료계획, 처방, 재검 일정)
--
-- images 구조 (배열):
--   [{ url: string, tags: string[], caption: string | null }]
--   tags 예시: ['xray', 'thorax'], ['ultrasound', 'abdomen'], ['physical']
--   → 리포트 뷰에서 태그 기준으로 해당 페이지에 자동 배치
--
-- data 구조: section_type별로 자유 JSONB
-- ============================================================
CREATE TABLE checkup_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id    uuid NOT NULL REFERENCES checkup_records(id) ON DELETE CASCADE,

  section_type  text NOT NULL
                  CHECK (section_type IN ('inquiry', 'physical', 'lab', 'imaging', 'assessment', 'plan')),

  data          jsonb NOT NULL DEFAULT '{}',

  updated_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (checkup_id, section_type)
);

CREATE INDEX idx_checkup_sections_checkup_id ON checkup_sections(checkup_id);


-- ============================================================
-- 3. checkup_images — 이미지 + AI 자동 분류
--
-- 업로드 흐름:
--   1. 이미지 무작위 업로드
--   2. AI(Vision)가 이미지 분석 → section, tags, description 자동 분류
--      - 환자 사진(전신/얼굴)  → section: 'cover',    tags: ['patient']
--      - 피부/귀/관절 등       → section: 'physical', tags: ['skin'|'ear'|'joint'|'eye'|...]
--      - 초음파 이미지         → section: 'imaging',  tags: ['ultrasound', 'liver'|'kidney'|'bladder'|'spleen'|'heart'|...]
--      - 방사선 이미지         → section: 'imaging',  tags: ['xray', 'thorax'|'abdomen'|'limb'|...]
--      - CT/MRI               → section: 'imaging',  tags: ['ct'|'mri', 부위]
--   3. 수의사가 분류 확인 후 필요 시 수정 (section, tags override)
--   4. 리포트 뷰에서 tags 기준으로 해당 페이지에 자동 배치
--
-- section: AI 분류 or 수의사 수정값 (최종 적용값)
-- tags: 세부 위치/종류 (리포트 페이지 배치에 사용)
-- ai_section / ai_tags: AI 원본 분류 (수정 이력 추적용)
-- ============================================================
CREATE TABLE checkup_images (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id          uuid NOT NULL REFERENCES checkup_records(id) ON DELETE CASCADE,

  -- 원본 파일
  url                 text NOT NULL,
  original_filename   text,
  file_size           integer,                -- bytes

  -- AI 분류 결과 (원본 — 수정 이력 추적)
  ai_section          text,                   -- AI가 분류한 section
  ai_tags             text[] NOT NULL DEFAULT '{}',  -- AI가 붙인 태그
  ai_description      text,                   -- AI 이미지 설명
  ai_confidence       numeric(3, 2),          -- 0.00 ~ 1.00
  ai_analyzed_at      timestamptz,

  -- 수의사 확정값 (ai 분류 그대로 쓰거나 수정)
  section             text
                        CHECK (section IN ('cover', 'physical', 'imaging', 'lab', 'ophthalmic')),
  tags                text[] NOT NULL DEFAULT '{}',
  caption             text,

  sort_order          integer NOT NULL DEFAULT 0,

  created_by          uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkup_images_checkup_id ON checkup_images(checkup_id);
CREATE INDEX idx_checkup_images_section    ON checkup_images(section);


-- ============================================================
-- 4. checkup_ai_results — AI 종합소견
--
-- abnormal_findings 구조 (배열):
--   [{
--     item: string,           항목명 (e.g. 'ALT')
--     value: string,          측정값 (e.g. '120')
--     unit: string,           단위 (e.g. 'U/L')
--     ref_range: string,      장비 참고범위 (e.g. '10-88') — PDF에서 추출
--     interpretation: string  AI 해석 코멘트
--   }]
--
-- monitoring_items 구조 (배열):
--   [{
--     item: string,       모니터링 항목
--     interval: string,   권고 주기 (e.g. '3개월')
--     priority: string    'high' | 'medium' | 'low'
--   }]
-- ============================================================
CREATE TABLE checkup_ai_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id      uuid NOT NULL REFERENCES checkup_records(id) ON DELETE CASCADE,

  -- AI 생성 결과 (수의사가 수정 가능)
  summary         text,                              -- 종합소견
  abnormal_findings jsonb NOT NULL DEFAULT '[]',     -- 주요 이상소견 목록
  weight_advice   text,                              -- 체중·영양 관리 권고
  monitoring_items jsonb NOT NULL DEFAULT '[]',      -- 모니터링/재검 권고

  raw_ai_output   text,                              -- AI 원본 응답 (디버깅용)

  -- 승인 정보 (approved 시 기록)
  approved_at     timestamptz,
  approved_by     uuid REFERENCES users(user_id) ON DELETE SET NULL,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (checkup_id)
);

CREATE INDEX idx_checkup_ai_results_checkup_id ON checkup_ai_results(checkup_id);


-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION update_checkup_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checkup_records_updated_at
  BEFORE UPDATE ON checkup_records
  FOR EACH ROW EXECUTE FUNCTION update_checkup_updated_at();

CREATE TRIGGER trg_checkup_sections_updated_at
  BEFORE UPDATE ON checkup_sections
  FOR EACH ROW EXECUTE FUNCTION update_checkup_updated_at();

CREATE TRIGGER trg_checkup_ai_results_updated_at
  BEFORE UPDATE ON checkup_ai_results
  FOR EACH ROW EXECUTE FUNCTION update_checkup_updated_at();

-- checkup_images는 updated_at 없음 (immutable — 수정 시 삭제 후 재업로드)


-- ============================================================
-- RLS (Row Level Security)
--
-- 설계 원칙:
--   authenticated: 같은 병원(hos_id) 데이터 전체 CRUD
--   anon: 직접 접근 없음
--   보호자 공유 URL 접근: createAdminClient() 기반 서버 액션으로 RLS 우회
--                        (resource_shares 시스템, resource_type = 'checkup')
-- ============================================================

-- get_my_hos_id() 함수는 oncology migration에서 이미 생성된 경우 생략
-- CREATE OR REPLACE FUNCTION get_my_hos_id() ...


-- ── checkup_records ──────────────────────────────────────────
ALTER TABLE checkup_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkup_records_select" ON checkup_records
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());

CREATE POLICY "checkup_records_insert" ON checkup_records
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "checkup_records_update" ON checkup_records
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "checkup_records_delete" ON checkup_records
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());


-- ── checkup_sections ─────────────────────────────────────────
ALTER TABLE checkup_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkup_sections_select" ON checkup_sections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_sections_insert" ON checkup_sections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_sections_update" ON checkup_sections
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_sections_delete" ON checkup_sections
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );


-- ── checkup_images ───────────────────────────────────────────
ALTER TABLE checkup_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkup_images_select" ON checkup_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_images_insert" ON checkup_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_images_update" ON checkup_images
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_images_delete" ON checkup_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );


-- ── checkup_ai_results ───────────────────────────────────────
ALTER TABLE checkup_ai_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkup_ai_results_select" ON checkup_ai_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_ai_results_insert" ON checkup_ai_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_ai_results_update" ON checkup_ai_results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "checkup_ai_results_delete" ON checkup_ai_results
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM checkup_records r
      WHERE r.id = checkup_id AND r.hos_id = get_my_hos_id()
    )
  );
