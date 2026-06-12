# ICU AI 어시스트 기능 개발 문서

## 개요

ICU 입원 환자의 검사결과·임상 정보를 등록하고, AI(Claude Sonnet)가 입원 이력 전체를 분석하여 치료 오더를 추천하는 기능입니다. 수의사가 추천 오더를 검토·승인하면 실제 차트에 반영됩니다.

---

## DB 스키마

### `icu_lab_results`
검사결과 및 임상 정보를 저장합니다.

```sql
CREATE TABLE icu_lab_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icu_io_id     UUID NOT NULL REFERENCES icu_ios(icu_io_id),
  icu_chart_id  UUID REFERENCES icu_charts(icu_chart_id),
  hos_id        UUID NOT NULL REFERENCES hospitals(hos_id),
  panel_type    TEXT NOT NULL,        -- cbc | chem | ua | coag | other
  items         JSONB NOT NULL DEFAULT '{}',
  raw_text      TEXT,
  clinical_summary TEXT,             -- 임상 소견/문진/신체검사 요약 (자유 텍스트)
  source_type   TEXT NOT NULL,       -- manual | ocr | pdf
  tested_at     TIMESTAMPTZ,
  created_by    UUID REFERENCES users(user_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS**: `hos_id = (SELECT hos_id FROM users WHERE user_id = auth.uid())`

### `icu_ai_sessions`
AI 추천 세션을 저장합니다.

```sql
CREATE TABLE icu_ai_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icu_io_id        UUID NOT NULL REFERENCES icu_ios(icu_io_id),
  icu_chart_id     UUID REFERENCES icu_charts(icu_chart_id),
  hos_id           UUID NOT NULL REFERENCES hospitals(hos_id),
  dx_name          TEXT NOT NULL,
  dx_certainty     icu_dx_certainty NOT NULL,  -- confirmed | probable | suspected | rule_out
  context_snapshot JSONB,           -- AI 호출 시점의 컨텍스트 스냅샷
  status           icu_ai_session_status NOT NULL DEFAULT 'pending',  -- pending | completed | error
  ai_response      JSONB,           -- AI 응답 원문 (summary + orders)
  error_message    TEXT,
  created_by       UUID REFERENCES users(user_id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `icu_ai_orders`
세션별 추천 오더를 저장합니다.

```sql
CREATE TABLE icu_ai_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES icu_ai_sessions(id),
  icu_io_id           UUID NOT NULL REFERENCES icu_ios(icu_io_id),
  hos_id              UUID NOT NULL REFERENCES hospitals(hos_id),
  order_type          TEXT NOT NULL,
  order_name          TEXT NOT NULL,
  order_detail        JSONB,         -- { order_comment, order_times, summary }
  ai_reasoning        TEXT,
  approval_status     icu_ai_approval_status NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  approved_order_id   UUID,          -- 승인 후 생성된 실제 icu_orders ID
  drug_conc_mg_per_ml FLOAT,
  vet_comment         TEXT,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 파일 구조

```
lib/
  actions/icu/
    lab-result-actions.ts       -- 검사결과 CRUD + AI OCR 추출
    ai-session-actions.ts       -- AI 세션 요청, 오더 승인/거절
  utils/icu/
    drug-calc.ts                -- parseDoseMgPerKg, rewriteCommentWithVolume

components/hospital/icu/main/chart/selected-chart/chart-header/
  header-right-buttons/
    ai-assist/
      ai-assist-sheet.tsx           -- 메인 시트 (검사결과 탭 / AI 추천 탭)
      lab-result-section.tsx        -- 검사결과 목록
      add-lab-result-dialog.tsx     -- 검사결과 추가 다이얼로그
      ai-session-tab.tsx            -- AI 추천 탭
      ai-request-dialog.tsx         -- AI 추천 요청 다이얼로그
      ai-order-card.tsx             -- 추천 오더 카드 (승인/거절)
```

---

## 주요 기능

### 1. 검사결과 등록

#### OCR / PDF 분석
- 이미지: Google Vision API로 텍스트 추출 → Claude Haiku로 파싱
- PDF: Claude document block으로 직접 전달 (OCR 없이)
- 단일 AI 호출로 **혈액검사 수치(lab_panels)** + **임상 요약(clinical_summary)** 동시 추출

**날짜별 분리 추출**: 표에 여러 날짜 컬럼이 있으면 날짜마다 별도 패널로 생성

```json
{
  "lab_panels": [
    { "panel_type": "cbc", "items": { "WBC": "12.3 ×10³/μL H" }, "tested_at": "2026-06-24T00:00:00" },
    { "panel_type": "cbc", "items": { "WBC": "10.1 ×10³/μL"   }, "tested_at": "2026-06-25T00:00:00" },
    { "panel_type": "cbc", "items": { "WBC": "9.4 ×10³/μL"    }, "tested_at": "2026-06-26T00:00:00" }
  ],
  "clinical_summary": "체온 39.5℃, 호흡 빠름, 복수 소견. 3일 전부터 식욕 저하."
}
```

#### 중복 처리 (`checkDuplicatePanels`)
- 분석 완료 후 DB에 같은 `icu_io_id` + `panel_type` + `tested_at(날짜)` 조합이 있는지 체크
- 중복 패널은 UI에서 "이미 등록됨" 배지로 표시 + 투명도 낮춤
- **기본 동작: 중복 건너뜀** — 클릭하면 "덮어쓰기"로 전환 가능
- `tested_at`이 null인 패널은 항상 신규 INSERT
- 저장 완료 메시지에 "N건 저장 / N건 덮어씀 / N건 중복 건너뜀" 표시

#### 저장 결과 타입
```ts
type SaveMultipleResult = {
  savedIds: string[]
  skippedCount: number
  overwrittenCount: number
}
```

- 여러 패널 저장: `saveMultipleLabResults` (중복 체크 포함)
- 임상 요약은 저장된 첫 번째 패널에만 기록 (중복 방지)
- 혈액검사 없이 임상 요약만 있는 경우 `panel_type: 'other', items: {}` 로 저장

#### 직접 입력
- 자유 텍스트 임상 소견 입력란 + 검사 수치 항목 에디터 분리
- 소견만 입력하거나 수치만 입력하거나 둘 다 입력 가능

---

### 2. AI 오더 추천

#### 컨텍스트 구성 (`requestAiRecommendation`)

AI에 전달되는 전체 컨텍스트:

| 항목 | 출처 | 설명 |
|------|------|------|
| 환자 기본정보 | `icu_ios`, `patients` | 이름, 종/품종, 나이, 체중 |
| 입원 정보 | `icu_ios.in_date` + `icu_charts.target_date` | 입원일, 현재 차트 날짜, 입원 N일차 |
| 이전 차트 이력 | `icu_charts` + `icu_orders` + `icu_txs` | 최근 7일 내 차트별 오더 목록 + checklist 처치 결과 |
| 바이탈/처치 기록 | `icu_txs` (checklist 타입) | 체온·호흡수·체중·배변·배뇨 등 실측값 |
| 검사결과 | `icu_lab_results` | 혈액검사 수치 패널 전체 |
| 임상 요약 | `icu_lab_results.clinical_summary` | OCR/PDF/직접 입력된 임상 정보 |
| 현재 오더 | `chartData.orders` (checklist 제외) | 현재 차트 처방 오더 |
| 추가 임상 정보 | 사용자 직접 입력 | 현재 상태 보완 또는 이전 추천 피드백 |

#### 프롬프트 구조

```
━━ 환자 정보 ━━
이름, 종/품종, 나이, 체중, 입원일, 현재 차트(입원 N일차)

━━ 진단 ━━
주증상, 기존 진단명, 현재 진단명(확실도)

━━ 이전 차트 이력 (최근 7일) ━━
[YYYY-MM-DD — 입원 N일차]
  - [type] 오더명 (코멘트)
  [바이탈/처치]
  체온: 08시: 39.5, 14시: 38.9
  ...

━━ 최근 검사결과 ━━
[CBC — 2026-06-24]
  WBC: 12.3 ×10³/μL H
  ...

━━ 임상 정보 요약 ━━
(clinical_summary 중복 제거 후 병합)

━━ YYYY-MM-DD 바이탈/처치 기록 ━━
체온: 08시: 39.5
호흡수: 08시: 28

━━ YYYY-MM-DD (입원 N일차) 현재 처방 오더 ━━
- [fluid] 하트만 수액 (20 mL/hr IV CRI)
...

━━ 추가 임상 정보 / 피드백 ━━
(사용자 입력 내용, 있을 경우에만)

━━ 지시사항 ━━
1. 입원 N일차 기준, 이전 이력·추가 정보 반영하여 추천
2. 현재 오더와 중복 금지
3. order_comment는 간결한 처방 지시문만
4. 수액 첨가제는 수액 comment에 포함 (별도 injection 금지)
...
```

#### 오더 응답 형식 (JSON)

```json
{
  "summary": "치료 방향 요약",
  "orders": [
    {
      "order_type": "fluid",
      "order_name": "0.9% NaCl",
      "order_comment": "27 mL/hr IV CRI, 첨가제: KCl 20mEq/L + 비타민B 1mL",
      "order_times": ["0800", "2000"],
      "ai_reasoning": "저칼륨·고나트륨 교정 목적. 24h Na 10mEq/L 이하 서서히 교정.",
      "drug_in_hos_drugs": true
    }
  ]
}
```

---

### 3. 오더 승인/거절 (`approveAiOrder`)

승인 시 처리 흐름:

1. 수의사 이름 조회 (`users` 테이블)
2. `order_times` 배열 파싱 → 24개 원소 배열로 변환
   - `"0900"` → index 9에 수의사 이름, 나머지 `"0"`
3. 약물 농도 입력 시 `rewriteCommentWithVolume` 실행
   - `1 mg/kg` + 체중 6.67kg + 농도 1mg/mL → `"6.67mg ÷ 1mg/ml = 6.67ml"`
4. `icu_orders` 테이블에 실제 오더 INSERT
5. `icu_ai_orders.approval_status` → `'approved'` 업데이트

**약물 농도 입력 UI:**
- `injection` 타입 오더에만 농도 입력란 표시
- mg/kg + 체중 + 농도 → 실시간 ml 계산 미리보기

---

### 4. 재추천 (추가 임상 정보 입력)

AI 추천 결과가 마음에 들지 않거나, 추가 정보를 반영하고 싶을 때:

1. "새 추천" 버튼 클릭
2. "추가 임상 정보" 텍스트에어리어에 자유 입력
   - 예: "오늘 오전부터 호흡이 빨라지고 있고 복수가 더 늘었음. 이전 추천의 수액 속도를 낮춰서 다시 추천해줘."
3. 새 세션 생성 및 AI 재호출

세션은 누적 저장되며 드롭다운으로 이전 세션 조회 가능.

---

## 관련 유틸리티

### `parseDoseMgPerKg(comment: string): number | null`
```ts
// "1 mg/kg SC SID" → 1
// comment에서 mg/kg 용량을 정규식으로 추출
```

### `rewriteCommentWithVolume(comment, weightKg, concMgPerMl): string`
```ts
// "1 mg/kg SC SID. 체중 6.67kg → 약 6.67mg SC SID"
// + 농도 1mg/mL 입력 시
// → "6.67mg ÷ 1mg/ml = 6.67ml SC SID"
```

### `buildOrderTimeArray(aiTimes, userName): string[]`
```ts
// AI가 ["0900", "2100"] 형식으로 전달
// → 24개 원소 배열: index 9 = "수의사이름", index 21 = "수의사이름", 나머지 = "0"
```

### `extractJsonObject<T>(text: string): T`
- AI 응답에서 JSON 추출 (마크다운 코드블록, 앞뒤 텍스트 제거)
- 깊이 추적(depth tracking) 방식으로 중괄호 균형 파악
- 파싱 실패 시 원문 앞 500자 서버 로그 출력

---

## AI 사용량 로깅

| feature | 모델 | 시점 |
|---------|------|------|
| `icu_lab_ocr` | claude-haiku-4-5 | 이미지/PDF 검사결과 추출 |
| `icu_ai_orders` | claude-sonnet-4-6 | 오더 추천 |

`ai_usage_logs` 테이블에 기록 → `/admin/ai-usage` 페이지에서 조회 가능

---

## 주요 설계 결정 사항

1. **'use server' 제약**: 서버 액션 파일에서 비동기 함수만 export 가능 → 순수 유틸(`parseDoseMgPerKg` 등)은 `lib/utils/icu/drug-calc.ts`로 분리

2. **`icu_chart_order_time` 형식**: 24개 원소 문자열 배열 (index = 시간, 값 = 수의사 이름 또는 `"0"`)

3. **수액 첨가제 처리**: 비타민·전해질 등 수액에 섞는 약물은 별도 injection 오더 대신 수액 `order_comment`의 첨가제 항목에 포함

4. **임상 요약 중복 방지**: 여러 패널 저장 시 `clinical_summary`는 첫 번째 패널에만 저장

5. **바이탈 추출**: `checklist` 타입 오더의 `icu_txs.icu_chart_tx_result`에서 추출 (null, 빈 문자열, `"0"` 제외)

6. **이전 차트 조회 범위**: 입원 전체가 아닌 현재 차트 기준 최근 7일 이내로 제한 (토큰 비용 관리)
