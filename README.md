1. icu_io.memo[number].chosen & selected ?
2. CPCR여부 미지정..
3. 수의사 셀렉트
4. shadcn field

- 도메인 호스팅 : hostingkr, 구글오어스계정 junsgk, 2년 21450원
- vercel 월 20달러
- 수퍼베이스 : 월 25달러

```ts
// 맥OS 한글 마지막 중복입력 에러
if (e.nativeEvent.isComposing || e.key !== 'Enter') return
```

# 규칙

### 선언순서

1. 구조분해
2. next hook
3. custom hook
4. react hook

### 타입선언

```ts
// 타입 섞인 경우
import { type Dispatch, type SetStateAction, useState } from 'react'
// 모두 타입인 경우
import type { Hospital, User } from '@/types'
```

### Props 타이핑

props가 한개인경우 구조분해 할당으로, 2개 이상인 경우 타입 선언

```ts
🚫🚫
type Props = {
  defaultChartOrders: SelectedIcuOrder[]
}

export default function DefaultOrdersTable({
  defaultChartOrders,
}: Props) {}


✅✅
export default function DefaultOrdersTable({
  defaultChartOrders,
}: {
  defaultChartOrders: SelectedIcuOrder[]
}) {}
```

### boolean 변수는 isEdit, isIcu 등 is 붙이기

### Visually hidden

```tsx
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
export default function CalculatorSheetContent() {
  return (
    <VisuallyHidden>
      <SheetTitle />
      <SheetDescription />
    </VisuallyHidden>
  )
}
```

### 하나의 object를 가져오는 경우, 다수의 객체를 가져오는 경우 함수 명명

```
fetchTodo
fetchTodos
```

### 타입선언에 관하여

- 타입 폴더에서 선언하지 말고 사용이 밀접한 곳에서 선언
- 데이터를 가져오는 함수에 선언하기

### page.tsx 파일의 컴포넌트 명

```tsx
import DotLottie from '@/components/common/dot-lottie'
import ApprovalWaitingContents from '@/components/on-boarding/approval-waiting-contents'
import { fetchUserApproval } from '@/lib/services/on-boarding/on-boarding'

export default async function ApprovalWaitingPage() {
  const userApprovalData = await fetchUserApproval()

  return (
    <>
      <ApprovalWaitingContents userApprovalData={userApprovalData} />
      <DotLottie className="mt-4 w-full" path="/dot-lottie/waiting.lottie" />
    </>
  )
}
```

// dental DB구조
-- ============================================================
-- 동물병원 치과 차트 마이그레이션
-- Supabase / PostgreSQL
-- ============================================================


-- ============================================================
-- Table 1: dental_charts
-- 차트 전반 (1회 내원 = 1행)
-- ============================================================

CREATE TABLE dental_charts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── 병원 / 환자 / 담당자 ─────────────────────────
  hos_id          UUID NOT NULL,          -- 동물병원 ID
  patient_id      UUID NOT NULL,          -- 환자 FK
  vet_id          JSONB DEFAULT '[]'::JSONB, -- 담당 수의사 배열 [{"id": "uuid", "role": "주치의"}, ...]

  chart_date      DATE NOT NULL,
  species         TEXT CHECK (species IN ('canine', 'feline', 'other')),

  -- ── 전신 마취 정보 ───────────────────────────────
  anesthesia      BOOLEAN DEFAULT false,
  anesthesia_note TEXT,

  -- ── 두개 / 구강 형태 ────────────────────────────
  skull_type      TEXT CHECK (skull_type IN (
                    'dolichocephalic',    -- 장두형 (그레이하운드 등)
                    'mesocephalic',       -- 중두형
                    'brachycephalic'      -- 단두형 (불독, 페르시안 등)
                  )),
  occlusion       TEXT CHECK (occlusion IN (
                    'normal',
                    'class1',             -- 치아만 교합 이상
                    'class2',             -- 하악전돌 (overbite)
                    'class3',             -- 상악전돌 (underbite)
                    'class4'              -- 비대칭
                  )),
  crowding        TEXT CHECK (crowding IN ('none', 'mild', 'moderate', 'severe')),

  -- ── 전체 치은 / 치주 평가 ───────────────────────
  gingivitis_overall    TEXT CHECK (gingivitis_overall IN (
                          'none', 'mild', 'moderate', 'severe'
                        )),
  calculus_overall      TEXT CHECK (calculus_overall IN (
                          'none', 'mild', 'moderate', 'severe'
                        )),
  -- 치주 질환 병기 (AVDC 기준)
  periodontitis_stage   TEXT CHECK (periodontitis_stage IN (
                          'healthy', 'stage1', 'stage2', 'stage3', 'stage4'
                        )),
  oral_mucosa     TEXT,                   -- 구강 점막 소견
  tongue_eval     TEXT,                   -- 혀 소견
  palate_eval     TEXT,                   -- 구개 소견
  tonsil_eval     TEXT,                   -- 편도 소견
  pharynx_eval    TEXT,                   -- 인두 소견
  salivary_eval   TEXT,                   -- 침샘 소견
  lymph_node_eval TEXT,                   -- 하악 림프절 소견

  -- ── 방사선 ──────────────────────────────────────
  xray_taken      BOOLEAN DEFAULT false,
  xray_findings   TEXT,

  -- ── 전체 치과 처치 내역 ─────────────────────────
  procedure_scaling     BOOLEAN DEFAULT false,
  procedure_polishing   BOOLEAN DEFAULT false,
  procedure_irrigation  BOOLEAN DEFAULT false,
  procedure_fluoride    BOOLEAN DEFAULT false,
  procedure_other       TEXT,             -- 기타 처치 자유 기재

  -- ── 치료 계획 (차트 레벨) ───────────────────────
  treatment_plan        TEXT,             -- 전체 치료 계획 요약
  recheck_interval      TEXT CHECK (recheck_interval IN (
                          '1month', '3months', '6months', '12months', 'as_needed'
                        )),
  homecare_instruction  TEXT,             -- 가정 관리 지침

  -- ── 메모 ────────────────────────────────────────
  general_note    TEXT,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- Table 2: dental_chart_teeth
-- 치아별 평가 (1치아 = 1행)
-- ============================================================

CREATE TABLE dental_chart_teeth (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── 병원 / 차트 연결 ────────────────────────────
  hos_id          UUID NOT NULL,          -- 동물병원 ID
  chart_id        UUID NOT NULL REFERENCES dental_charts(id) ON DELETE CASCADE,

  -- ── 치아 식별 (Triadan System) ──────────────────
  -- 상악 우측: 101~110  상악 좌측: 201~210
  -- 하악 좌측: 301~311  하악 우측: 401~411
  tooth_id        SMALLINT NOT NULL,      -- 예: 104 = 우상악 견치
  tooth_name      TEXT,                   -- 예: 'Right Maxillary Canine'
  is_deciduous    BOOLEAN DEFAULT false,  -- 유치 여부

  -- ── 치아 존재 여부 ───────────────────────────────
  status          TEXT CHECK (status IN (
                    'present',            -- 정상 존재
                    'missing',            -- 선천적 결손
                    'extracted',          -- 이미 발치됨
                    'unerupted',          -- 미맹출
                    'persistent'          -- 유치 잔존
                  )) DEFAULT 'present',

  -- ── 치주 평가 ────────────────────────────────────
  gingivitis      TEXT CHECK (gingivitis IN ('none', 'mild', 'moderate', 'severe')),
  calculus        TEXT CHECK (calculus IN ('none', 'mild', 'moderate', 'severe')),
  plaque          TEXT CHECK (plaque IN ('none', 'mild', 'moderate', 'severe')),

  -- 치주낭 깊이 (mm) - 6포인트 측정
  probing_ml      SMALLINT,               -- mesial-lingual
  probing_l       SMALLINT,               -- lingual / palatal (center)
  probing_dl      SMALLINT,               -- distal-lingual
  probing_mb      SMALLINT,               -- mesial-buccal
  probing_b       SMALLINT,               -- buccal (center)
  probing_db      SMALLINT,               -- distal-buccal

  -- 치은 퇴축 (mm) - 6포인트 측정
  recession_ml    SMALLINT,
  recession_l     SMALLINT,
  recession_dl    SMALLINT,
  recession_mb    SMALLINT,
  recession_b     SMALLINT,
  recession_db    SMALLINT,
  -- ※ 부착 소실(CAL) = 치주낭 깊이 + 치은 퇴축 → 앱에서 계산

  -- 치아 동요도
  mobility        TEXT CHECK (mobility IN (
                    'none',               -- 정상
                    'grade1',             -- <1mm 수평 동요
                    'grade2',             -- 1~2mm 수평 동요
                    'grade3'              -- >2mm 또는 수직 동요
                  )),

  -- 치근 분기부 병변 (다근치 해당)
  furcation       TEXT CHECK (furcation IN (
                    'none',
                    'grade1',             -- 탐침이 1/3 미만 진입
                    'grade2',             -- 탐침이 1/3~2/3 진입
                    'grade3'              -- 탐침이 관통
                  )),

  -- ── 치아 병변 ────────────────────────────────────
  fracture        TEXT CHECK (fracture IN (
                    'none',
                    'enamel',             -- 법랑질 골절
                    'uncomplicated',      -- 비복잡 치관 골절 (치수 비노출)
                    'complicated',        -- 복잡 치관 골절 (치수 노출)
                    'crown_root',         -- 치관-치근 골절
                    'root'                -- 치근 골절
                  )),
  pulp_exposure   BOOLEAN DEFAULT false,  -- 치수 노출
  caries          TEXT CHECK (caries IN ('none', 'mild', 'moderate', 'severe')),
  resorption      TEXT CHECK (resorption IN (
                    'none',
                    'type1',              -- 치주 염증성 흡수 (개)
                    'type2',              -- 대체성 흡수 (고양이 FORL)
                    'type3'               -- 혼합형
                  )),
  staining        TEXT CHECK (staining IN ('none', 'mild', 'moderate', 'severe')),
  attrition       TEXT CHECK (attrition IN ('none', 'mild', 'moderate', 'severe')),  -- 교모
  abrasion        TEXT CHECK (abrasion IN ('none', 'mild', 'moderate', 'severe')),   -- 마모
  supernumerary   BOOLEAN DEFAULT false,  -- 과잉치

  -- ── 방사선 소견 ──────────────────────────────────
  xray_finding    TEXT,

  -- ── 치아별 처치 내역 ─────────────────────────────
  -- 선택지 예시: 'scaling', 'polishing', 'extraction',
  --             'root_canal', 'vital_pulp_therapy',
  --             'crown_restoration', 'composite_restoration',
  --             'gingivectomy', 'alveoloplasty',
  --             'periodontal_surgery', 'splinting'
  treatment_done  TEXT[],

  -- ── 치아별 치료 계획 ─────────────────────────────
  treatment_plan  TEXT[],
  treatment_priority TEXT CHECK (treatment_priority IN (
                    'urgent',             -- 즉시 처치 필요
                    'recommended',        -- 권장
                    'elective',           -- 선택적
                    'monitor'             -- 경과 관찰
                  )),

  -- ── 메모 ─────────────────────────────────────────
  tooth_note      TEXT,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (chart_id, tooth_id)             -- 차트당 동일 치아 중복 방지
);


-- ============================================================
-- 인덱스
-- ============================================================

-- dental_charts
CREATE INDEX idx_dental_charts_hos_id     ON dental_charts (hos_id);
CREATE INDEX idx_dental_charts_patient    ON dental_charts (patient_id);
CREATE INDEX idx_dental_charts_date       ON dental_charts (chart_date);
CREATE INDEX idx_dental_charts_hos_date   ON dental_charts (hos_id, chart_date);

-- dental_chart_teeth
CREATE INDEX idx_teeth_hos_id             ON dental_chart_teeth (hos_id);
CREATE INDEX idx_teeth_chart_id           ON dental_chart_teeth (chart_id);
CREATE INDEX idx_teeth_tooth_id           ON dental_chart_teeth (tooth_id);
CREATE INDEX idx_teeth_hos_chart          ON dental_chart_teeth (hos_id, chart_id);


-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dental_charts_updated_at
  BEFORE UPDATE ON dental_charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_dental_teeth_updated_at
  BEFORE UPDATE ON dental_chart_teeth
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- hos_id 일관성 보장 트리거
-- dental_chart_teeth.hos_id 가 dental_charts.hos_id 와
-- 반드시 일치하도록 강제
-- ============================================================

CREATE OR REPLACE FUNCTION check_teeth_hos_id()
RETURNS TRIGGER AS $$
DECLARE
  parent_hos_id UUID;
BEGIN
  SELECT hos_id INTO parent_hos_id
  FROM dental_charts
  WHERE id = NEW.chart_id;

  IF NEW.hos_id != parent_hos_id THEN
    RAISE EXCEPTION
      'dental_chart_teeth.hos_id (%) must match dental_charts.hos_id (%)',
      NEW.hos_id, parent_hos_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_teeth_hos_id_check
  BEFORE INSERT OR UPDATE ON dental_chart_teeth
  FOR EACH ROW EXECUTE FUNCTION check_teeth_hos_id();


-- ============================================================
-- RLS (Row Level Security) 기본 틀 - 필요 시 활성화
-- ============================================================

ALTER TABLE dental_charts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_chart_teeth ENABLE ROW LEVEL SECURITY;

-- 병원별 데이터 격리 정책 예시
-- (실제 auth 구조에 맞게 수정 필요)
--
-- CREATE POLICY "hospital_isolation_charts"
--   ON dental_charts
--   FOR ALL
--   USING (hos_id = (SELECT hos_id FROM users WHERE id = auth.uid()));
--
-- CREATE POLICY "hospital_isolation_teeth"
--   ON dental_chart_teeth
--   FOR ALL
--   USING (hos_id = (SELECT hos_id FROM users WHERE id = auth.uid()));