-- ============================================================
-- 수의 항암치료 AI 가이드 플랫폼 — DB Migration
-- Supabase SQL Editor에서 순서대로 실행
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
  diagnosis_category        text[] NOT NULL DEFAULT '{}', -- 복수 선택: '{lymphoma, mct}'
  diagnosis_method          text[] NOT NULL DEFAULT '{}', -- 복수 선택: '{fna, biopsy}'
  stage                     text,                    -- 자유 텍스트: "Stage III"

  -- 환자 임상 정보 (진단 시점)
  age_at_diagnosis_days     integer,                 -- 일(day) 단위 저장, UI: Xy Xm 표기
  body_weight               numeric(5, 2),           -- kg (진단 시점, 초기 기준값)
  sex                       text CHECK (sex IN ('male', 'female', 'male_neutered', 'female_neutered')),

  -- 케이스 상태
  status                    text NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'completed', 'discontinued', 'deceased')),
  case_date                 date NOT NULL DEFAULT CURRENT_DATE,

  -- 담당 수의사 / 작성자
  vet_id                    uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_by                uuid REFERENCES users(user_id) ON DELETE SET NULL,

  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_cases_hos_id     ON onco_cases(hos_id);
CREATE INDEX idx_onco_cases_patient_id ON onco_cases(patient_id);
CREATE INDEX idx_onco_cases_status     ON onco_cases(status);
CREATE INDEX idx_onco_cases_case_date  ON onco_cases(case_date);


-- ============================================================
-- 2. onco_diagnosis_inputs — 진단 자료 (파일 업로드 or 직접 입력)
-- 1 케이스에 복수 입력 가능 (FNA + 조직검사 결과 각각)
-- ============================================================
CREATE TABLE onco_diagnosis_inputs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,

  input_type          text NOT NULL CHECK (input_type IN ('file', 'text')),

  -- 파일 업로드 (PDF / TXT / 이미지)
  file_url            text,
  file_name           text,
  file_type           text CHECK (file_type IN ('pdf', 'txt', 'image')),

  -- 텍스트 (직접 입력 or AI 추출)
  raw_text            text,            -- 직접 입력 텍스트
  ai_extracted_text   text,            -- AI가 파일에서 추출한 텍스트

  -- 임상 정보 (직접 입력 모드)
  clinical_signs      text,            -- 임상 증상
  clinical_course     text,            -- 경과
  additional_notes    text,

  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_diagnosis_inputs_case_id ON onco_diagnosis_inputs(case_id);


-- ============================================================
-- 3. onco_protocols — 프로토콜 템플릿
-- AI 생성 or 수동 작성 — 재사용 가능한 표준 양식
-- hos_id = NULL이면 전체 공용 템플릿
-- ============================================================
CREATE TABLE onco_protocols (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id              uuid REFERENCES hospitals(hos_id) ON DELETE CASCADE, -- NULL = 공용

  -- 식별
  diagnosis_key       text NOT NULL,    -- AI 캐시 키: "canine_lymphoma_b_cell"
  protocol_name       text NOT NULL,    -- "CHOP", "CCNU", "AC" 등
  protocol_type       text NOT NULL CHECK (protocol_type IN ('chemo', 'surgery', 'radiation', 'multimodal')),
  phase               text NOT NULL DEFAULT 'induction'
                        CHECK (phase IN ('induction', 'maintenance', 'rescue', 'adjuvant')),

  -- 기간
  total_cycles        integer,
  total_weeks         integer,

  -- 개요
  description         text,
  mst_days            integer,          -- Median Survival Time (일)
  response_rate       numeric(4, 3) CHECK (response_rate BETWEEN 0 AND 1), -- 0.000 ~ 1.000

  -- ── 약물 목록 (JSONB array) ──────────────────────────────
  -- 각 항목 스키마:
  -- {
  --   drug_name: string,
  --   drug_class: string,            -- "Vinca alkaloid", "Alkylating agent" 등
  --   route: "oral" | "iv" | "sc" | "im",
  --   dose_value: number,
  --   dose_unit: "mg/kg" | "mg/m2" | "fixed_mg",
  --   frequency: "q24h" | "q48h" | "q7d" | "q14d" | "q21d" | "q28d",
  --   cycle_day: number,             -- 사이클 내 투약 일차 (1, 8, 15 등)
  --   duration_days: number,         -- 연속 투약 일수
  --   is_oral: boolean,
  --   precautions: string,
  --   adverse_effects: string,
  --   contraindications: string,
  --   owner_instructions: string     -- 경구제 집에서 투약 시 주의사항
  -- }
  drugs               jsonb NOT NULL DEFAULT '[]',

  -- ── 수술 정보 (해당 시) ────────────────────────────────
  -- { surgery_type, timing: "before_chemo"|"after_chemo"|"concurrent", notes }
  surgery_details     jsonb,

  -- ── 방사선 정보 (해당 시) ──────────────────────────────
  -- { total_dose_gy, fraction_count, fraction_schedule, technique, timing }
  radiation_details   jsonb,

  -- ── 주의사항 / 부작용 / 금기 ──────────────────────────
  precautions         text,
  -- [{ drug_a, drug_b, severity: "major"|"moderate"|"minor", description }]
  drug_interactions   jsonb NOT NULL DEFAULT '[]',
  -- [{ name, vcog_grade: 1-5, frequency: "common"|"uncommon"|"rare", description }]
  adverse_effects     jsonb NOT NULL DEFAULT '[]',
  contraindications   text,

  -- ── 보호자 안내 (분리) ────────────────────────────────
  owner_instructions  text,
  -- ["집에서 관찰해야 할 증상", "즉시 내원 기준" ...]
  owner_warning_signs jsonb NOT NULL DEFAULT '[]',

  -- ── 참고 문헌 ─────────────────────────────────────────
  -- [{ title, authors, journal, year, url }]
  ref_sources         jsonb NOT NULL DEFAULT '[]',

  -- ── 메타 ──────────────────────────────────────────────
  is_ai_generated     boolean NOT NULL DEFAULT false,
  ai_model_version    text,
  is_verified         boolean NOT NULL DEFAULT false,  -- 수의사 검수 완료
  version             integer NOT NULL DEFAULT 1,

  created_by          uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_protocols_diagnosis_key  ON onco_protocols(diagnosis_key);
CREATE INDEX idx_onco_protocols_hos_id         ON onco_protocols(hos_id);
CREATE INDEX idx_onco_protocols_protocol_type  ON onco_protocols(protocol_type);


-- ============================================================
-- 4. onco_ai_cache — AI 응답 캐시
-- 동일 진단 + 쿼리 조합은 DB에서 즉시 제공 (재호출 없음)
-- ============================================================
CREATE TABLE onco_ai_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  diagnosis_key   text NOT NULL,    -- "canine_lymphoma_b_cell"
  query_type      text NOT NULL CHECK (query_type IN ('treatment_options', 'protocol_detail')),
  protocol_name   text,             -- query_type = 'protocol_detail' 일 때

  response_json   jsonb NOT NULL,   -- 표준화된 AI 응답 전문
  model_version   text,
  version         integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,

  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,      -- NULL이면 만료 없음

  UNIQUE (diagnosis_key, query_type, protocol_name, version)
);

CREATE INDEX idx_onco_ai_cache_lookup
  ON onco_ai_cache(diagnosis_key, query_type, is_active);


-- ============================================================
-- 5. onco_case_protocols — 케이스-프로토콜 연결
-- 케이스에 프로토콜을 배정하고 진행 통계를 관리
-- ============================================================
CREATE TABLE onco_case_protocols (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id               uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,
  protocol_id           uuid NOT NULL REFERENCES onco_protocols(id) ON DELETE RESTRICT,

  -- 스케줄 최초 생성 시 기준 체중 (이후 각 회차는 onco_schedules.body_weight_at_visit 사용)
  initial_body_weight   numeric(5, 2) NOT NULL, -- kg

  start_date            date NOT NULL,
  end_date              date,

  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'completed', 'discontinued')),
  discontinue_reason    text,

  -- 진행 통계 (스케줄 업데이트 시 자동 갱신)
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
-- 프로토콜의 각 약물 투약을 날짜별로 분해한 테이블
-- ============================================================
CREATE TABLE onco_schedules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_protocol_id      uuid NOT NULL REFERENCES onco_case_protocols(id) ON DELETE CASCADE,

  -- 회차 정보
  cycle_number          integer NOT NULL,   -- 사이클 번호 (1, 2, 3 ...)
  day_number            integer NOT NULL,   -- 사이클 내 일차 (1, 8, 15 ...)
  scheduled_date        date NOT NULL,

  -- 약물 정보
  drug_name             text NOT NULL,
  drug_route            text NOT NULL CHECK (drug_route IN ('oral', 'iv', 'sc', 'im')),
  dose_per_kg           numeric(8, 4),      -- mg/kg
  dose_per_m2           numeric(8, 4),      -- mg/m²
  dose_unit             text NOT NULL DEFAULT 'mg/kg'
                          CHECK (dose_unit IN ('mg/kg', 'mg/m2', 'fixed_mg')),

  -- 체중 기반 용량 계산
  body_weight_at_visit  numeric(5, 2),      -- kg — 해당 회차 실측 체중
  dose_calculated       numeric(8, 3),      -- mg (체중 × dose_per_kg 또는 BSA × dose_per_m2)

  -- 실제 투약 기록
  status                text NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled', 'completed', 'delayed', 'skipped', 'reduced')),
  dose_actual           numeric(8, 3),      -- 실제 투약량 (mg)
  administered_at       timestamptz,
  administered_by       uuid REFERENCES users(user_id) ON DELETE SET NULL,

  -- 변경 사유
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
  drug_name           text,           -- 원인 약물 (특정 불가 시 NULL)
  event_type          text NOT NULL,  -- "neutropenia" | "vomiting" | "anorexia" | "lethargy" 등
  vcog_grade          integer NOT NULL CHECK (vcog_grade BETWEEN 1 AND 5),
  description         text,
  action_taken        text,           -- 투약 중단 / 용량 감량 / 지지 치료 등

  resolved            boolean NOT NULL DEFAULT false,
  resolved_date       date,

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

  -- 종양 크기 측정 (해당 시)
  measurement_before    numeric(7, 2),  -- mm
  measurement_after     numeric(7, 2),  -- mm

  notes                 text,
  image_urls            jsonb NOT NULL DEFAULT '[]',

  created_by            uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_response_evals_case_id ON onco_response_evals(case_id);


-- ============================================================
-- 9. onco_qol_records — QoL 트래킹 (매 내원 시)
-- ============================================================
CREATE TABLE onco_qol_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,

  visit_date      date NOT NULL,
  body_weight     numeric(5, 2),   -- kg

  -- 1 = 매우 나쁨 / 5 = 매우 좋음
  vitality_score  integer CHECK (vitality_score BETWEEN 1 AND 5),
  appetite_score  integer CHECK (appetite_score BETWEEN 1 AND 5),
  owner_score     integer CHECK (owner_score BETWEEN 1 AND 5),  -- 보호자 주관 평가

  notes           text,

  created_by      uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_qol_records_case_id    ON onco_qol_records(case_id);
CREATE INDEX idx_onco_qol_records_visit_date ON onco_qol_records(visit_date);


-- ============================================================
-- 10. onco_report_tokens — 보호자 공유 토큰
-- 수의사가 "보호자 공유" 버튼 클릭 시 토큰 생성
-- anon 사용자는 이 토큰으로만 oncology 데이터에 접근 가능
-- ============================================================
CREATE TABLE onco_report_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid NOT NULL REFERENCES onco_cases(id) ON DELETE CASCADE,

  token       uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(), -- URL에 포함되는 공유 토큰
  expires_at  timestamptz,          -- NULL이면 만료 없음
  is_active   boolean NOT NULL DEFAULT true,

  -- 보호자에게 노출할 범위 설정 (수의사가 제어)
  show_schedule     boolean NOT NULL DEFAULT true,   -- 투약 스케줄 공개
  show_adverse      boolean NOT NULL DEFAULT false,  -- 부작용 기록 공개
  show_response     boolean NOT NULL DEFAULT true,   -- 치료 반응 공개
  show_qol          boolean NOT NULL DEFAULT true,   -- QoL 공개

  created_by  uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onco_report_tokens_token   ON onco_report_tokens(token);
CREATE INDEX idx_onco_report_tokens_case_id ON onco_report_tokens(case_id);


-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
-- 헬퍼 함수: 현재 로그인 사용자의 hos_id 반환
-- (auth.uid()가 users 테이블의 user_id와 일치한다고 가정)
CREATE OR REPLACE FUNCTION get_my_hos_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT hos_id FROM users WHERE user_id = auth.uid()
$$;


-- ── onco_cases ───────────────────────────────────────────────
ALTER TABLE onco_cases ENABLE ROW LEVEL SECURITY;

-- 같은 병원 authenticated 사용자: 전체 CRUD
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

-- anon: 유효한 토큰이 있는 케이스만 읽기 허용
CREATE POLICY "onco_cases_anon_share" ON onco_cases
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM onco_report_tokens t
      WHERE t.case_id = onco_cases.id
        AND t.is_active = true
        AND (t.expires_at IS NULL OR t.expires_at > now())
    )
  );


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
-- 공용(hos_id IS NULL) 프로토콜은 모든 authenticated 사용자가 읽기 가능
-- 자기 병원 프로토콜은 CRUD 가능
ALTER TABLE onco_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onco_protocols_select" ON onco_protocols
  FOR SELECT TO authenticated
  USING (hos_id IS NULL OR hos_id = get_my_hos_id());

CREATE POLICY "onco_protocols_insert" ON onco_protocols
  FOR INSERT TO authenticated
  WITH CHECK (hos_id = get_my_hos_id());  -- 공용 프로토콜은 관리자만 (서비스롤 별도 처리)

CREATE POLICY "onco_protocols_update" ON onco_protocols
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "onco_protocols_delete" ON onco_protocols
  FOR DELETE TO authenticated
  USING (hos_id = get_my_hos_id());


-- ── onco_ai_cache ────────────────────────────────────────────
-- 읽기: 모든 authenticated (병원 공유 캐시)
-- 쓰기: authenticated (서버 액션에서 삽입)
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

-- anon: 토큰 있는 케이스의 스케줄만 읽기
CREATE POLICY "onco_case_protocols_anon_share" ON onco_case_protocols
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM onco_report_tokens t
      WHERE t.case_id = onco_case_protocols.case_id
        AND t.is_active = true
        AND t.show_schedule = true
        AND (t.expires_at IS NULL OR t.expires_at > now())
    )
  );


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

-- anon: show_schedule = true인 토큰
CREATE POLICY "onco_schedules_anon_share" ON onco_schedules
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM onco_case_protocols cp
      JOIN onco_report_tokens t ON t.case_id = cp.case_id
      WHERE cp.id = onco_schedules.case_protocol_id
        AND t.is_active = true
        AND t.show_schedule = true
        AND (t.expires_at IS NULL OR t.expires_at > now())
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

-- anon: show_adverse = true인 토큰만
CREATE POLICY "onco_adverse_events_anon_share" ON onco_adverse_events
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM onco_report_tokens t
      WHERE t.case_id = onco_adverse_events.case_id
        AND t.is_active = true
        AND t.show_adverse = true
        AND (t.expires_at IS NULL OR t.expires_at > now())
    )
  );


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

-- anon: show_response = true인 토큰만
CREATE POLICY "onco_response_evals_anon_share" ON onco_response_evals
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM onco_report_tokens t
      WHERE t.case_id = onco_response_evals.case_id
        AND t.is_active = true
        AND t.show_response = true
        AND (t.expires_at IS NULL OR t.expires_at > now())
    )
  );


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

-- anon: show_qol = true인 토큰만
CREATE POLICY "onco_qol_records_anon_share" ON onco_qol_records
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM onco_report_tokens t
      WHERE t.case_id = onco_qol_records.case_id
        AND t.is_active = true
        AND t.show_qol = true
        AND (t.expires_at IS NULL OR t.expires_at > now())
    )
  );


-- ── onco_report_tokens ───────────────────────────────────────
-- 토큰 자체는 anon도 읽을 수 있어야 공유 페이지에서 유효성 검증 가능
ALTER TABLE onco_report_tokens ENABLE ROW LEVEL SECURITY;

-- anon: 토큰 값으로 직접 조회 (공유 URL 접근 시)
CREATE POLICY "onco_report_tokens_anon_select" ON onco_report_tokens
  FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- authenticated: 자기 병원 케이스의 토큰만 CRUD
CREATE POLICY "onco_report_tokens_auth_select" ON onco_report_tokens
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_report_tokens_insert" ON onco_report_tokens
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_report_tokens_update" ON onco_report_tokens
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));

CREATE POLICY "onco_report_tokens_delete" ON onco_report_tokens
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM onco_cases c WHERE c.id = case_id AND c.hos_id = get_my_hos_id()));
