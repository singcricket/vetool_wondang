# 수의 항암치료 AI 가이드 플랫폼 — 기획 및 설계 문서

> 최초 작성: 2026-05-14 / 최종 업데이트: 2026-05-14
> 상태: **DB 구축 완료 ✅ / MVP 구현 완료 ✅ — AI 가이드 캐시 만료 UX + 문서 업로드 기능 추가**

---

## 프로젝트 개요

수의사가 항암치료를 수행할 때, 진단부터 치료 종료까지 전 과정을 AI가 가이드하고,  
치료 데이터를 축적하여 병원 간 공유가 가능한 수의 종양학 임상 지원 플랫폼.

**FNA 또는 조직검사를 통해 악성 종양이 확진된 시점부터 시스템이 작동한다.**

---

## 네비게이션 구조

### 1. 메인 사이드바 (`constants/hospital/hos-sidebar-menus.tsx`)

`HOS_SIDEBAR_MENUS`에 항목 추가:

```tsx
{
  name: '항암',
  path: 'oncology',
  isReady: true,
  isVetOnly: true,
  icon: <Pill />,   // lucide-react Pill 아이콘 사용 예정 (또는 커스텀 SVG)
}
```

클릭 시 → `/hospital/[hos_id]/oncology` → `[target_date]`로 redirect

---

### 2. 라우팅 구조 (dental 패턴 동일)

```
app/hospital/[hos_id]/oncology/
  page.tsx                          → 오늘 날짜로 redirect
  [target_date]/
    layout.tsx                      → OncologySidebar + OncologyFooter 마운트
    page.tsx                        → 차트 작성 진입점 (케이스 목록)
    [case_id]/
      page.tsx                      → 케이스 상세 차트
    search/
      page.tsx                      → 케이스 검색 페이지
```

---

### 3. 내부 사이드바 (dental-desktop-sidebar 패턴)

```
components/hospital/oncology/
  oncology-sidebar/
    oncology-sidebar.tsx            → 서버 컴포넌트: 데이터 fetch → Desktop + Mobile 렌더
    oncology-desktop-sidebar.tsx    → 클라이언트: realtime 구독 포함
    oncology-date-selector.tsx      → 날짜 이동
    oncology-register-dialog.tsx    → 신규 케이스 등록 다이얼로그
    oncology-case-button.tsx        → 등록된 케이스 버튼 (환자명 + 진단명)
    mobile/
      mobile-oncology-sidebar.tsx
      mobile-oncology-sidebar-sheet.tsx
```

**사이드바 구성:**
```
┌─────────────────────┐
│  [날짜 네비게이터]    │  ← oncology-date-selector
├─────────────────────┤
│  + 신규 케이스 등록   │  ← oncology-register-dialog (버튼 클릭 → 환자 검색 → 케이스 생성)
├─────────────────────┤
│  ● 환자A / Lymphoma  │
│  ● 환자B / MCT       │  ← oncology-case-button (등록된 케이스 목록)
│  ● 환자C / OSA       │
│  ...                 │
└─────────────────────┘
```

---

### 4. 내부 Footer (dental-footer 패턴)

```
components/hospital/oncology/
  oncology-footer/
    oncology-footer.tsx
```

**Footer 메뉴 구성:**

```tsx
const FOOTER_MENUS = [
  { label: '차트 작성', value: 'chart',  icon: <FileTextIcon /> },
  { label: '케이스 검색', value: 'search', icon: <SearchIcon /> },
  // 추후: { label: '통계', value: 'stats', icon: <BarChart2Icon /> },
]
```

**URL 규칙:**
- 차트 작성: `/hospital/[hos_id]/oncology/[target_date]`
- 케이스 검색: `/hospital/[hos_id]/oncology/[target_date]/search`
- (추후) 통계: `/hospital/[hos_id]/oncology/[target_date]/stats`

---

### 전체 레이아웃 구조 (`[target_date]/layout.tsx`)

```tsx
// dental layout.tsx와 동일한 패턴
<OncologyContextProvider ...>
  <div className="flex h-desktop">
    <OncologySidebar hosId={hos_id} targetDate={target_date} />
    <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-[200px] 2xl:w-auto">
      {children}
    </div>
  </div>
  <OncologyFooter hosId={hos_id} targetDate={target_date} />
</OncologyContextProvider>
```

---

## 케이스 시작 — 진단 입력 2가지 옵션

| 방법 | 설명 |
|------|------|
| **파일 업로드** | 진단서 PDF / JPG / PNG (최대 5MB) 업로드 → Claude AI가 내용 분석 → 임상증상·경과·추가정보 자동 채움 |
| **직접 입력** | 진단명, 임상 증상, 경과 직접 텍스트 입력 |

**파일 업로드 처리 흐름:**
```
클라이언트에서 파일 선택 (5MB 초과 시 즉시 차단)
  → base64 변환
  → uploadAndExtractDiagnosis() 서버 액션 호출
      ├─ Supabase Storage 업로드 (oncology-documents 버킷)
      │   └─ 실패해도 AI 추출은 계속 진행
      ├─ Claude API 호출
      │   ├─ PDF: document 블록
      │   └─ 이미지(JPG/PNG): image 블록
      ├─ 추출 결과 onco_diagnosis_inputs (input_type='document')에 저장
      └─ { clinical_signs, clinical_course, raw_text } 반환 → 폼 자동 채움
```

→ 이 내용을 바탕으로 AI 항암 프로토콜 제시 시작

---

## DB 테이블 구조 (10개) — ✅ Supabase 적용 완료

> 마이그레이션 SQL: `docs/oncology-db-migration.sql`

### 관계도

```
patients
  └── onco_cases
        ├── onco_diagnosis_inputs
        ├── onco_case_protocols ──────── onco_protocols (템플릿, 재사용)
        │     └── onco_schedules
        ├── onco_adverse_events
        ├── onco_response_evals
        ├── onco_qol_records
        └── onco_report_tokens           ← 보호자 공유 토큰

onco_ai_cache    (AI 응답 캐시 — 병원 공용)
```

---

### ① onco_cases — 케이스 마스터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| hos_id | **uuid FK** | hospitals(hos_id) |
| patient_id | uuid FK | patients(patient_id) |
| diagnosis_name | text NOT NULL | "Lymphoma (B-cell, Multicentric)" |
| diagnosis_category | **text[]** | 복수선택: `'{lymphoma,mct}'` |
| diagnosis_method | **text[]** | 복수선택: `'{fna,biopsy}'` |
| stage | text | "Stage III" (자유 텍스트) |
| age_at_diagnosis_days | **integer** | 일(day) 단위 — UI: `Xy Xm` 표기 |
| body_weight | numeric(5,2) | 진단 시점 체중 kg |
| sex | text | `male` \| `female` \| `male_neutered` \| `female_neutered` |
| status | text | `active` \| `completed` \| `discontinued` \| `deceased` |
| case_date | date | |
| vet_id | **uuid FK** | 담당 수의사 users(user_id) |
| created_by | uuid FK | users(user_id) |
| notes | text | |

---

### ② onco_diagnosis_inputs — 진단 자료

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | onco_cases(id) CASCADE |
| input_type | text | `text` \| `document` |
| file_url | text | Supabase Storage 공개 URL |
| file_name | text | |
| file_type | text | `application/pdf` \| `image/jpeg` \| `image/png` |
| raw_text | text | 직접 입력 텍스트 or 문서에서 추출된 추가 정보 |
| ai_extracted_text | text | Claude API 원문 응답 (디버깅/감사용) |
| clinical_signs | text | 임상 증상 |
| clinical_course | text | 경과 |
| additional_notes | text | |

> UNIQUE: `(case_id, input_type)` — 케이스당 text 1개, document 1개 (upsert)

---

### ③ onco_protocols — 프로토콜 템플릿

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| hos_id | **uuid FK nullable** | NULL이면 공용 템플릿 |
| diagnosis_key | text | 캐시 키: `"canine_lymphoma_b_cell"` |
| protocol_name | text | "CHOP", "CCNU" 등 |
| protocol_type | text | `chemo` \| `surgery` \| `radiation` \| `multimodal` |
| phase | text | `induction` \| `maintenance` \| `rescue` \| `adjuvant` |
| total_cycles | integer | |
| total_weeks | integer | |
| description | text | |
| mst_days | integer | Median Survival Time (일) |
| response_rate | numeric(4,3) | 0.000 ~ 1.000 |
| drugs | jsonb | 약물 목록 (스키마 아래 참조) |
| surgery_details | jsonb | 수술 정보 (해당 시) |
| radiation_details | jsonb | 방사선 정보 (해당 시) |
| precautions | text | 일반 주의사항 |
| drug_interactions | jsonb | 약물 상호작용 목록 |
| adverse_effects | jsonb | 부작용 목록 |
| contraindications | text | 금기 사항 |
| owner_instructions | text | **보호자 안내 (분리)** |
| owner_warning_signs | jsonb | **즉시 내원 기준 증상 목록** |
| **ref_sources** | jsonb | 참고 문헌 (`references`는 PG 예약어라 변경) |
| is_ai_generated | boolean | |
| ai_model_version | text | |
| is_verified | boolean | 수의사 검수 완료 |
| version | integer | |

#### drugs JSONB 스키마 (배열)
```jsonc
[{
  "drug_name": "Vincristine",
  "drug_class": "Vinca alkaloid",
  "route": "iv",            // "oral" | "iv" | "sc" | "im"
  "dose_value": 0.7,
  "dose_unit": "mg/m2",     // "mg/kg" | "mg/m2" | "fixed_mg"
  "frequency": "q7d",       // "q24h" | "q48h" | "q7d" | "q14d" | "q21d" | "q28d"
  "cycle_day": 1,
  "duration_days": 1,
  "is_oral": false,
  "precautions": "...",
  "adverse_effects": "...",
  "contraindications": "...",
  "owner_instructions": "..."
}]
```

#### surgery_details / radiation_details JSONB
```jsonc
// surgery_details
{ "surgery_type": "Excision", "timing": "before_chemo", "notes": "..." }

// radiation_details
{ "total_dose_gy": 48, "fraction_count": 16, "fraction_schedule": "3회/주", "technique": "IMRT", "timing": "after_chemo" }
```

#### drug_interactions / adverse_effects JSONB
```jsonc
// drug_interactions
[{ "drug_a": "...", "drug_b": "...", "severity": "major", "description": "..." }]

// adverse_effects
[{ "name": "Neutropenia", "vcog_grade": 3, "frequency": "common", "description": "..." }]
```

---

### ④ onco_ai_cache — AI 응답 캐시

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| diagnosis_key | text | |
| query_type | text | `treatment_options` \| `protocol_detail` |
| protocol_name | text nullable | protocol_detail 조회 시 |
| response_json | jsonb | 표준화된 AI 응답 전문 |
| model_version | text | |
| version | integer | |
| is_active | boolean | |
| created_at | timestamptz | |
| expires_at | timestamptz | 90일 후 만료 (NULL이면 만료 없음) |

**UNIQUE**: `(diagnosis_key, query_type, protocol_name, version)`

**캐시 만료 UX:**
- `expires_at < now()` → `isExpired: true` 반환
- UI: 앰버색 배너 "XX일/개월 전 생성된 추천입니다" + "새 추천 받기" 버튼 표시
- "새 추천 받기" 클릭 → 기존 캐시 `is_active=false` 비활성화 → Claude API 재호출
- "기존 유지" 클릭 → 배너 닫고 기존 프로토콜 그대로 사용

---

### ⑤ onco_case_protocols — 케이스-프로토콜 연결

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| protocol_id | uuid FK | RESTRICT (참조 보호) |
| **initial_body_weight** | numeric(5,2) NOT NULL | 스케줄 최초 생성 기준 체중 |
| start_date | date | |
| end_date | date | |
| status | text | `active` \| `completed` \| `discontinued` |
| discontinue_reason | text | |
| total_doses | integer | 자동 집계 |
| completed_doses | integer | |
| delayed_doses | integer | |
| reduced_doses | integer | |

> 매 회차 실측 체중은 `onco_schedules.body_weight_at_visit`에서 관리

---

### ⑥ onco_schedules — 회차별 투약 스케줄

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_protocol_id | uuid FK | |
| cycle_number | integer | 사이클 번호 |
| day_number | integer | 사이클 내 일차 |
| scheduled_date | date | |
| drug_name | text | |
| drug_route | text | `oral` \| `iv` \| `sc` \| `im` |
| dose_per_kg | numeric(8,4) | mg/kg |
| dose_per_m2 | numeric(8,4) | mg/m² |
| dose_unit | text | `mg/kg` \| `mg/m2` \| `fixed_mg` |
| **body_weight_at_visit** | numeric(5,2) | **해당 회차 실측 체중 (kg)** |
| dose_calculated | numeric(8,3) | mg (체중 기반 계산값) |
| status | text | `scheduled` \| `completed` \| `delayed` \| `skipped` \| `reduced` |
| dose_actual | numeric(8,3) | 실제 투약량 (mg) |
| administered_at | timestamptz | |
| administered_by | uuid FK | |
| delay_reason | text | |
| reduction_reason | text | |
| notes | text | |

---

### ⑦ onco_adverse_events — 부작용 (VCOG-CTCAE)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| case_protocol_id | uuid FK nullable | |
| event_date | date | |
| drug_name | text | 원인 약물 (불명 시 NULL) |
| event_type | text | "neutropenia" \| "vomiting" \| "anorexia" 등 |
| vcog_grade | integer | 1 ~ 5 |
| description | text | |
| action_taken | text | 투약 중단 / 감량 / 지지치료 등 |
| resolved | boolean | |
| resolved_date | date | |

---

### ⑧ onco_response_evals — 치료 반응 평가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| case_protocol_id | uuid FK nullable | |
| eval_date | date | |
| modality | text | `xray` \| `ultrasound` \| `ct` \| `physical_exam` \| `mri` \| `cytology` |
| response_type | text | `CR` \| `PR` \| `SD` \| `PD` |
| measurement_before | numeric(7,2) | mm |
| measurement_after | numeric(7,2) | mm |
| notes | text | |
| image_urls | jsonb | |

---

### ⑨ onco_qol_records — QoL 트래킹

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| visit_date | date | |
| body_weight | numeric(5,2) | kg |
| vitality_score | integer | 1 ~ 5 |
| appetite_score | integer | 1 ~ 5 |
| owner_score | integer | 1 ~ 5 (보호자 주관 평가) |
| notes | text | |

---

### ⑩ onco_report_tokens — 보호자 공유 토큰

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | onco_cases(id) CASCADE |
| token | uuid UNIQUE | URL에 포함되는 공유 토큰 |
| expires_at | timestamptz | NULL이면 만료 없음 |
| is_active | boolean | |
| show_schedule | boolean | 투약 스케줄 공개 (기본 ON) |
| show_adverse | boolean | 부작용 기록 공개 (기본 OFF) |
| show_response | boolean | 치료 반응 공개 (기본 ON) |
| show_qol | boolean | QoL 공개 (기본 ON) |
| created_by | uuid FK | |

---

## RLS (Row Level Security) — ✅ 적용 완료

| 역할 | 읽기 | 쓰기/수정/삭제 |
|------|------|---------------|
| `authenticated` | 같은 병원(`hos_id`) 데이터 전체 | 같은 병원 데이터만 |
| `anon` | 유효한 토큰 + `show_*=true`인 항목만 | ❌ 불가 |

- 헬퍼 함수 `get_my_hos_id()` 사용 — `auth.uid()` → `users.hos_id` 반환
- `onco_protocols`: `hos_id IS NULL`(공용)도 authenticated 읽기 허용
- `onco_ai_cache`: 모든 병원이 공유하는 캐시 — authenticated 전체 읽기/쓰기

### 보호자 공유 URL 흐름
```
수의사 → "보호자 공유" 클릭
       → onco_report_tokens에 토큰 생성 (show_* 항목 선택)
       → URL: /share/oncology/{token}
보호자 → URL 접근 (비로그인 anon)
       → token 조회 → 유효성 확인
       → show_* 설정에 따른 허용 데이터만 읽기
```

---

## 화면 구조 (탭 기반)

```
케이스 상세 페이지
├── Tab 1: 진단 & AI 가이드
│     - 진단 문서 업로드 (PDF/JPG/PNG, 5MB 이하) → AI 임상정보 자동 추출
│     - 직접 텍스트 입력 (임상증상 / 임상경과 / 직접입력)
│     - 케이스 기본 정보 편집 (체중/병기/성별/상태/진단방법)
│     - AI 프로토콜 추천 (onco_ai_cache 90일 캐시)
│     - 캐시 만료 시 기존 가이드 유지 or 새 추천 선택 UX
│     - 수의사 검수/승인 단계 (is_verified)
│
├── Tab 2: 프로토콜 & 스케줄
│     - 프로토콜 선택 (AI 제안 or 수동 작성)
│     - 경구(is_oral)/주사 구분, 투약 간격 자동 반영
│     - 체중 기반 투약량 자동 계산 (initial_body_weight)
│     - 전체 기간 투약 스케줄 테이블 자동 생성 (onco_schedules)
│     - 수술/방사선 옵션 포함 (surgery_details / radiation_details)
│
├── Tab 3: 투약 기록
│     - 회차별 완료 체크 + 실측 체중 입력 (body_weight_at_visit)
│     - 연기/감량 기록 및 사유
│     - 전체 수행률(%) 표시 / Dose Intensity 계산
│
├── Tab 4: 부작용 모니터링
│     - VCOG-CTCAE Grade 1~5 기록 (onco_adverse_events)
│     - 혈액검사(CBC/Chemistry) 기반 투약 가능 여부 판단 (2단계)
│
├── Tab 5: 치료 반응 평가
│     - CR / PR / SD / PD 기록 (onco_response_evals)
│     - Rescue Protocol 제시 (PD 시)
│
└── Tab 6: QoL 트래킹
      - 매 내원 체중, 활력, 식욕, 보호자 평가 (onco_qol_records)
      - 전체 기간 QoL 변화 그래프
```

---

## 개발 단계

### 1단계 — MVP ✅ 완료 (2026-05-14)
- [x] DB 설계 확정
- [x] Supabase SQL 실행 (10개 테이블)
- [x] RLS 정책 적용
- [x] 네비게이션 구조 확정 (dental 패턴 기준)
- [x] `database.types.ts` 업데이트 (pnpm supabase gen types)
- [x] `types/hospital/oncology-type.ts` 작성

**네비게이션 구현 ✅:**
- [x] `HOS_SIDEBAR_MENUS`에 `항암(oncology)` 항목 추가 (Pill 아이콘)
- [x] `app/hospital/[hos_id]/oncology/page.tsx` — 오늘 날짜로 redirect
- [x] `app/hospital/[hos_id]/oncology/[target_date]/layout.tsx` — sidebar + footer 마운트
- [x] `app/hospital/[hos_id]/oncology/[target_date]/page.tsx` — 케이스 선택 진입점
- [x] `app/hospital/[hos_id]/oncology/[target_date]/search/page.tsx` — 검색 페이지
- [x] `oncology-sidebar/` — sidebar, desktop, mobile, date-selector, register-dialog, patient-button
- [x] `oncology-footer/oncology-footer.tsx` — 케이스 / 케이스 검색 탭
- [x] `providers/oncology-context-provider.tsx`

**케이스 차트 구현 ✅:**
- [x] `app/hospital/[hos_id]/oncology/[target_date]/[case_id]/page.tsx`
- [x] `lib/services/oncology/fetch-oncology-case.ts` — 케이스 전체 데이터 fetch
- [x] `oncology-case-client.tsx` — 탭 기반 레이아웃 (환자 헤더 포함)
- [x] Tab 1: 진단 입력 (직접 텍스트 + 문서 업로드) + 케이스 기본 정보 수정 + AI 프로토콜 추천
- [x] Tab 2: 프로토콜 선택 + 투약 스케줄 자동 생성 (BSA/mg/kg 계산)
- [x] Tab 3: 투약 기록 체크 + 체중 입력 + 수행률 배너
- [x] Tab 4: 부작용 VCOG-CTCAE 기록 (G1~G5 컬러 코딩)
- [x] Tab 5: 치료 반응 평가 (CR/PR/SD/PD, 크기 비교)
- [x] Tab 6: QoL 트래킹 (활력/식욕/보호자 평가 1~5점)

**서비스/액션 레이어 ✅:**
- [x] `lib/actions/oncology/diagnosis-input-actions.ts`
- [x] `lib/actions/oncology/ai-oncology-guide.ts` — Claude API + 90일 캐시 (`getAiOncologyGuide` / `refreshAiOncologyGuide`)
- [x] `lib/actions/oncology/document-extraction-actions.ts` — PDF/이미지 업로드 + AI 임상정보 추출
- [x] `lib/actions/oncology/protocol-actions.ts` (스케줄 자동생성 포함)
- [x] `lib/actions/oncology/schedule-actions.ts` (카운터 자동 갱신)
- [x] `lib/actions/oncology/adverse-event-actions.ts`
- [x] `lib/actions/oncology/response-eval-actions.ts`
- [x] `lib/actions/oncology/qol-actions.ts`

**1단계 이후 추가된 기능 ✅:**
- [x] AI 가이드 캐시 만료 감지 (`isExpired`, `cachedAt` 반환)
- [x] 만료 시 배너 UX — 기존 프로토콜 표시 + "새 추천 받기" / "기존 유지" 선택
- [x] `refreshAiOncologyGuide` — 기존 캐시 비활성화 후 Claude 재호출
- [x] 진단 문서 업로드 (PDF/JPG/PNG, 5MB 이하, `oncology-documents` 버킷)
- [x] 문서 → Claude AI 분석 → 임상증상·경과·추가정보 자동 채움
- [x] `SelectItem` 빈 문자열 값 에러 수정 (`stage`, `sex`, `caseProtocolId` → `"none"` 센티널 사용)

> **인프라 메모**: `oncology-documents` Supabase Storage 버킷 생성 필요 (미생성 시 파일 저장만 실패, AI 추출은 정상 동작)

### 2단계
- [ ] 혈액검사(CBC/Chemistry) 기반 투약 가능 여부 자동 판단
- [ ] 보호자 안내문 자동 생성 (Claude API)
- [ ] `/share/oncology/[token]` 보호자 공유 페이지 (onco_report_tokens)

### 3단계
- [ ] 병원 내 케이스 분석 대시보드
- [ ] 치료 반응 / QoL 변화 그래프 시각화

### 4단계
- [ ] 병원 간 익명 데이터 공유 플랫폼
- [ ] 종양 종류 / 종별 / 품종별 비교 분석

---

## 기술 고려사항

| 항목 | 내용 |
|------|------|
| AI 모델 | Anthropic Claude API (cytology AI와 동일 패턴) |
| AI 응답 형식 | 표준화된 JSONB 스키마로 받아 `onco_protocols` + `onco_ai_cache`에 저장 |
| 파일 처리 | Supabase Storage + AI 텍스트 추출 |
| 경구/주사 분기 | `drugs[].is_oral` + `route` → 스케줄 생성 로직 분기 |
| 수의사 검수 | `is_verified` 플래그 + 미검수 시 UI 경고 배너 |
| VCOG-CTCAE | 상수 파일(`constants/hospital/oncology/vcog-ctcae.ts`)로 내장 예정 |
| 보호자 안내 | `owner_instructions` + `owner_warning_signs` 별도 필드 |
| 출처 표시 | `ref_sources` JSONB 필드 → UI에 항상 표시 |
| FK 타입 | `hos_id`, `patient_id`, `user_id` 모두 **UUID** (Supabase 실제 타입 기준) |
| PG 예약어 주의 | `references` → `ref_sources`로 변경 (컬럼명 충돌 방지) |
