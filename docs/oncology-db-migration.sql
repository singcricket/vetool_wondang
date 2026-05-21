-- ============================================================
-- 수의 항암치료 AI 가이드 플랫폼 — DB Migration
-- 최초 작성: 2026-05-14 / 최종 업데이트: 2026-05-20
-- Supabase SQL Editor에서 순서대로 실행
--
-- 변경 이력:
--   2026-05-14  최초 작성 (9개 테이블)
--   2026-05-15  onco_qol_records HHHHHMM 개편, onco_adverse_events reported_by 추가
--               onco_report_tokens 제거 (resource_shares 시스템으로 대체)
--   2026-05-20  onco_protocols user_tags/tags/origin_diagnosis 추가
--               onco_cases user_tags 추가
--               onco_diagnosis_inputs input_type/file_type 체크 수정, UNIQUE 추가
-- ============================================================


-- ============================================================
-- 1. onco_cases — 케이스 마스터
-- ============================================================
CREATE TABLE onco_cases (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id                    uuid NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  patient_id                uuid NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,

  -- 진단 정보
  diagnosis_name            text NOT NULL,           -- e.g. "Lymphoma (B-cell, Multicentric)"
  diagnosis_category        text[] NOT NULL DEFAULT '{}',
  diagnosis_method          text[] NOT NULL DEFAULT '{}',
  stage                     text,

  -- 환자 임상 정보 (진단 시점)
  age_at_diagnosis_days     integer,                 -- 일(day) 단위, UI: Xy Xm 표기
  body_weight               numeric(5, 2),           -- kg
  sex                       text CHECK (sex IN ('male', 'female', 'male_neutered', 'female_neutered')),

  -- 케이스 상태
  status                    text NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'completed', 'discontinued', 'deceased')),
  case_date                 date NOT NULL DEFAULT CURRENT_DATE,

  -- 담당 수의사 / 작성자
  vet_id                    uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_by                uuid REFERENCES users(user_id) ON DELETE SET NULL,

  -- 검색 태그 (콤마 구분 키워드 — 케이스 검색 및 프로토콜 라이브러리 자동 검색에 사용)
  user_tags                 text,

  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_cases_hos_id     ON onco_cases(hos_id);
CREATE INDEX idx_onco_cases_patient_id ON onco_cases(patient_id);
CREATE INDEX idx_onco_cases_status     ON onco_cases(status);
CREATE INDEX idx_onco_cases_case_date  ON onco_cases(case_date);


-- ============================================================
-- 2. onco_diagnosis_inputs — 진단 자료
-- UNIQUE(case_id, input_type): 케이스당 text 1개, document 1개
-- ============================================================
CREATE TABLE onco_diagnosis_inputs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,

  -- 'text': 직접 입력 / 보호자 안내문 저장
  -- 'document': 파일 업로드 + AI 추출 결과
  input_type          text NOT NULL CHECK (input_type IN ('text', 'document')),

  -- 파일 업로드 (document 타입)
  file_url            text,
  file_name           text,
  file_type           text CHECK (file_type IN ('application/pdf', 'image/jpeg', 'image/png')),

  -- AI 추출 / 직접 입력 텍스트
  raw_text            text,            -- 직접 입력 or 추가 정보
  ai_extracted_text   text,            -- Claude API 원문 응답 (디버깅/감사용)

  -- 임상 정보 (AI 추출 or 직접 입력)
  clinical_signs      text,
  clinical_course     text,

  -- additional_notes 용도:
  --   input_type='text'     → 보호자 안내문 (owner_note)
  --   input_type='document' → 업로드 파일 목록 JSON (SavedFileInfo[])
  additional_notes    text,

  created_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (case_id, input_type)
);

CREATE INDEX idx_onco_diagnosis_inputs_case_id ON onco_diagnosis_inputs(case_id);


-- ============================================================
-- 3. onco_protocols — 프로토콜 템플릿
-- hos_id = NULL: 전체 공용 템플릿 (authenticated 전체 읽기)
-- hos_id 지정: 해당 병원 라이브러리
-- ============================================================
CREATE TABLE onco_protocols (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id              uuid REFERENCES hospitals(hos_id) ON DELETE CASCADE, -- NULL = 공용

  -- 식별
  origin_diagnosis    text,             -- 이 프로토콜이 생성된 케이스의 diagnosis_key (nullable)
  protocol_name       text NOT NULL,
  protocol_type       text NOT NULL
                        CHECK (protocol_type IN ('chemo', 'surgery', 'radiation', 'targeted', 'palliative', 'combination', 'multimodal')),
  phase               text NOT NULL DEFAULT 'induction'
                        CHECK (phase IN ('induction', 'maintenance', 'rescue', 'adjuvant', 'palliative')),

  -- 기간
  total_cycles        integer,
  total_weeks         integer,

  -- 개요
  description         text,
  mst_days            integer,
  response_rate       numeric(4, 3) CHECK (response_rate BETWEEN 0 AND 1),

  -- 약물 목록 (JSONB array)
  -- [{
  --   drug_name, drug_class, route: "oral"|"iv"|"sc"|"im",
  --   dose_value, dose_unit: "mg/kg"|"mg/m2"|"fixed_mg",
  --   frequency: "q24h"|"q48h"|"q7d"|"q14d"|"q21d"|"q28d",
  --   cycle_day, duration_days, is_oral,
  --   precautions, adverse_effects, contraindications, owner_instructions
  -- }]
  drugs               jsonb NOT NULL DEFAULT '[]',

  surgery_details     jsonb,
  radiation_details   jsonb,

  precautions         text,
  -- [{ drug_a, drug_b, severity: "major"|"moderate"|"minor", description }]
  drug_interactions   jsonb NOT NULL DEFAULT '[]',
  -- [{ name, vcog_grade: 1-5, frequency: "common"|"uncommon"|"rare", description }]
  adverse_effects     jsonb NOT NULL DEFAULT '[]',
  contraindications   text,

  owner_instructions  text,
  owner_warning_signs jsonb NOT NULL DEFAULT '[]',

  -- [{ title, authors, journal, year, url }]
  ref_sources         jsonb NOT NULL DEFAULT '[]',

  -- 검색 태그
  user_tags           text,            -- 병원 입력 키워드 (콤마 구분)
  tags                text,            -- #태그 형식 자동 확장값 (keywords 테이블 기반)

  -- 메타
  is_ai_generated     boolean NOT NULL DEFAULT false,
  ai_model_version    text,
  is_verified         boolean NOT NULL DEFAULT false,
  version             integer NOT NULL DEFAULT 1,

  created_by          uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_protocols_hos_id         ON onco_protocols(hos_id);
CREATE INDEX idx_onco_protocols_origin_diag    ON onco_protocols(origin_diagnosis);
CREATE INDEX idx_onco_protocols_protocol_type  ON onco_protocols(protocol_type);


-- ============================================================
-- 4. onco_ai_cache — AI 응답 캐시 (병원 공유, 90일 만료)
-- ============================================================
CREATE TABLE onco_ai_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  diagnosis_key   text NOT NULL,
  query_type      text NOT NULL CHECK (query_type IN ('treatment_options', 'protocol_detail')),
  protocol_name   text,             -- query_type = 'protocol_detail'일 때

  response_json   jsonb NOT NULL,
  model_version   text,
  version         integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,

  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,      -- NULL이면 만료 없음 (90일 후 expires_at 설정 권장)

  UNIQUE (diagnosis_key, query_type, protocol_name, version)
);

CREATE INDEX idx_onco_ai_cache_lookup
  ON onco_ai_cache(diagnosis_key, query_type, is_active);


-- ============================================================
-- 5. onco_case_protocols — 케이스-프로토콜 연결
-- ============================================================
CREATE TABLE onco_case_protocols (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id               uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,
  protocol_id           uuid NOT NULL REFERENCES onco_protocols(id) ON DELETE RESTRICT,

  initial_body_weight   numeric(5, 2) NOT NULL, -- kg (스케줄 최초 생성 기준)

  start_date            date NOT NULL,
  end_date              date,

  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'completed', 'discontinued', 'paused')),
  discontinue_reason    text,

  -- 진행 통계
  total_doses           integer NOT NULL DEFAULT 0,
  completed_doses       integer NOT NULL DEFAULT 0,
  delayed_doses         integer NOT NULL DEFAULT 0,
  reduced_doses         integer NOT NULL DEFAULT 0,

  notes                 text,
  created_by            uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_case_protocols_case_id ON onco_case_protocols(case_id);


-- ============================================================
-- 6. onco_schedules — 회차별 투약 스케줄
-- ============================================================
CREATE TABLE onco_schedules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_protocol_id      uuid NOT NULL REFERENCES onco_case_protocols(id) ON DELETE CASCADE,

  cycle_number          integer NOT NULL,
  day_number            integer NOT NULL,
  scheduled_date        date NOT NULL,

  drug_name             text NOT NULL,
  drug_route            text NOT NULL CHECK (drug_route IN ('oral', 'iv', 'sc', 'im')),

  -- 투약량 기준 (Tab3에서 인라인 수정 가능)
  dose_per_kg           numeric(8, 4),   -- mg/kg
  dose_per_m2           numeric(8, 4),   -- mg/m²
  dose_unit             text NOT NULL DEFAULT 'mg/kg'
                          CHECK (dose_unit IN ('mg/kg', 'mg/m2', 'fixed_mg')),

  -- 체중 기반 계산
  body_weight_at_visit  numeric(5, 2),   -- kg (해당 회차 실측)
  dose_calculated       numeric(8, 3),   -- mg

  -- 실제 투약 기록
  status                text NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled', 'completed', 'delayed', 'skipped', 'reduced')),
  dose_actual           numeric(8, 3),
  administered_at       timestamptz,
  administered_by       uuid REFERENCES users(user_id) ON DELETE SET NULL,

  delay_reason          text,
  reduction_reason      text,
  notes                 text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_schedules_case_protocol_id ON onco_schedules(case_protocol_id);
CREATE INDEX idx_onco_schedules_scheduled_date   ON onco_schedules(scheduled_date);
CREATE INDEX idx_onco_schedules_status           ON onco_schedules(status);


-- ============================================================
-- 7. onco_adverse_events — 부작용 기록 (VCOG-CTCAE 기준)
-- ============================================================
CREATE TABLE onco_adverse_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,
  case_protocol_id    uuid REFERENCES onco_case_protocols(id) ON DELETE SET NULL,

  event_date          date NOT NULL,
  drug_name           text,
  event_type          text NOT NULL,
  vcog_grade          integer NOT NULL CHECK (vcog_grade BETWEEN 1 AND 5),
  description         text,
  action_taken        text,

  resolved            boolean NOT NULL DEFAULT false,
  resolved_date       date,

  -- 기록 주체: 'vet' = 수의사, 'owner' = 보호자 공유 URL에서 직접 입력
  -- reported_by='owner' 시 vcog_grade=1 고정, 보호자 용어 event_type 사용
  reported_by         text NOT NULL DEFAULT 'vet'
                        CHECK (reported_by IN ('vet', 'owner')),

  created_by          uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_adverse_events_case_id          ON onco_adverse_events(case_id);
CREATE INDEX idx_onco_adverse_events_case_protocol_id ON onco_adverse_events(case_protocol_id);


-- ============================================================
-- 8. onco_response_evals — 치료 반응 평가 (CR/PR/SD/PD)
-- ============================================================
CREATE TABLE onco_response_evals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id               uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,
  case_protocol_id      uuid REFERENCES onco_case_protocols(id) ON DELETE SET NULL,

  eval_date             date NOT NULL,
  modality              text NOT NULL
                          CHECK (modality IN ('xray', 'ultrasound', 'ct', 'physical_exam', 'mri', 'cytology')),
  response_type         text NOT NULL CHECK (response_type IN ('CR', 'PR', 'SD', 'PD')),

  measurement_before    numeric(7, 2),  -- mm
  measurement_after     numeric(7, 2),  -- mm

  notes                 text,
  image_urls            jsonb NOT NULL DEFAULT '[]',

  created_by            uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_response_evals_case_id ON onco_response_evals(case_id);


-- ============================================================
-- 9. onco_qol_records — QoL 트래킹 (HHHHHMM Scale)
-- 7개 항목 × 10점 = 70점 만점
--   50+: 양호 / 35-49: 경계 / 35미만: 불량
-- ============================================================
CREATE TABLE onco_qol_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id               uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,

  visit_date            date NOT NULL,
  body_weight           numeric(5, 2),   -- kg

  -- HHHHHMM 7개 항목 (각 1~10)
  pain_score            integer CHECK (pain_score BETWEEN 1 AND 10),        -- Hurt
  hunger_score          integer CHECK (hunger_score BETWEEN 1 AND 10),      -- Hunger
  hydration_score       integer CHECK (hydration_score BETWEEN 1 AND 10),   -- Hydration
  hygiene_score         integer CHECK (hygiene_score BETWEEN 1 AND 10),     -- Hygiene
  happiness_score       integer CHECK (happiness_score BETWEEN 1 AND 10),   -- Happiness
  mobility_score        integer CHECK (mobility_score BETWEEN 1 AND 10),    -- Mobility
  good_days_score       integer CHECK (good_days_score BETWEEN 1 AND 10),   -- More Good Days

  -- 주간 증상 빈도
  nausea_vomiting_days  integer CHECK (nausea_vomiting_days BETWEEN 0 AND 7),
  lethargy_days         integer CHECK (lethargy_days BETWEEN 0 AND 7),

  -- 행동 체크리스트 JSONB
  -- {
  --   plays_normally: boolean,    좋아하는 활동/놀이 참여
  --   social_interaction: boolean, 가족과 잘 어울림
  --   normal_sleep: boolean,      수면 정상
  --   toilet_normal: boolean,     대소변 정상
  --   grooming_normal: boolean,   털 관리 스스로 함
  --   shows_interest: boolean,    주변 환경에 관심
  --   pain_vocalization: boolean  아파서 신음 (inverted — true면 경고)
  -- }
  behavior_checklist    jsonb,

  -- 기록 주체: 'vet' | 'owner' | 'both'
  reported_by           text NOT NULL DEFAULT 'vet'
                          CHECK (reported_by IN ('vet', 'owner', 'both')),

  notes                 text,

  created_by            uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_qol_records_case_id    ON onco_qol_records(case_id);
CREATE INDEX idx_onco_qol_records_visit_date ON onco_qol_records(visit_date);


-- ============================================================
-- RLS (Row Level Security)
--
-- 설계 원칙:
--   authenticated: 같은 병원(hos_id) 데이터 전체 CRUD
--   anon: 직접 접근 없음
--   보호자 공유 URL 접근(읽기/쓰기): createAdminClient() 기반 서버 액션으로 RLS 우회
--
-- ※ onco_report_tokens 테이블은 제거됨.
--    공유는 기존 resource_shares 시스템(resource_type='oncology_owner') 사용.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_hos_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT hos_id FROM users WHERE user_id = auth.uid()
$$;


-- ── onco_cases ───────────────────────────────────────────────
ALTER TABLE onco_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_cases_select" ON onco_cases
  FOR SELECT TO authenticated
  USING (hos_id = get_my_hos_id());

CREATE POLICY "onco_cases_insert" ON onco_cases
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "onco_cases_update" ON onco_cases
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "onco_cases_delete" ON onco_cases
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());


-- ── onco_diagnosis_inputs ────────────────────────────────────
ALTER TABLE onco_diagnosis_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_diagnosis_inputs_select" ON onco_diagnosis_inputs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_diagnosis_inputs_insert" ON onco_diagnosis_inputs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_diagnosis_inputs_update" ON onco_diagnosis_inputs
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_diagnosis_inputs_delete" ON onco_diagnosis_inputs
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));


-- ── onco_protocols ───────────────────────────────────────────
-- 공용(hos_id IS NULL): authenticated 전체 읽기
-- 병원 소유: 해당 병원만 CRUD
ALTER TABLE onco_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_protocols_select" ON onco_protocols
  FOR SELECT TO authenticated
  USING (hos_id IS NULL OR hos_id = get_my_hos_id());

CREATE POLICY "onco_protocols_insert" ON onco_protocols
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "onco_protocols_update" ON onco_protocols
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "onco_protocols_delete" ON onco_protocols
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());


-- ── onco_ai_cache ────────────────────────────────────────────
-- 병원 공유 캐시 — authenticated 전체 읽기/쓰기
ALTER TABLE onco_ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_ai_cache_select" ON onco_ai_cache
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "onco_ai_cache_insert" ON onco_ai_cache
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "onco_ai_cache_update" ON onco_ai_cache
  FOR UPDATE TO authenticated
  USING (true);


-- ── onco_case_protocols ──────────────────────────────────────
ALTER TABLE onco_case_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_case_protocols_select" ON onco_case_protocols
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_case_protocols_insert" ON onco_case_protocols
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_case_protocols_update" ON onco_case_protocols
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_case_protocols_delete" ON onco_case_protocols
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));


-- ── onco_schedules ───────────────────────────────────────────
ALTER TABLE onco_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_schedules_select" ON onco_schedules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM onco_case_protocols cp
      JOIN onco_cases c ON c.id = cp.case_id
      WHERE cp.id = case_protocol_id AND c.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "onco_schedules_insert" ON onco_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM onco_case_protocols cp
      JOIN onco_cases c ON c.id = cp.case_id
      WHERE cp.id = case_protocol_id AND c.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "onco_schedules_update" ON onco_schedules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM onco_case_protocols cp
      JOIN onco_cases c ON c.id = cp.case_id
      WHERE cp.id = case_protocol_id AND c.hos_id = get_my_hos_id()
    )
  );

CREATE POLICY "onco_schedules_delete" ON onco_schedules
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM onco_case_protocols cp
      JOIN onco_cases c ON c.id = cp.case_id
      WHERE cp.id = case_protocol_id AND c.hos_id = get_my_hos_id()
    )
  );


-- ── onco_adverse_events ──────────────────────────────────────
ALTER TABLE onco_adverse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_adverse_events_select" ON onco_adverse_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_adverse_events_insert" ON onco_adverse_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_adverse_events_update" ON onco_adverse_events
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_adverse_events_delete" ON onco_adverse_events
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));


-- ── onco_response_evals ──────────────────────────────────────
ALTER TABLE onco_response_evals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_response_evals_select" ON onco_response_evals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_response_evals_insert" ON onco_response_evals
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_response_evals_update" ON onco_response_evals
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_response_evals_delete" ON onco_response_evals
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));


-- ── onco_qol_records ─────────────────────────────────────────
ALTER TABLE onco_qol_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_qol_records_select" ON onco_qol_records
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_qol_records_insert" ON onco_qol_records
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_qol_records_update" ON onco_qol_records
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_qol_records_delete" ON onco_qol_records
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));
