# 수의 항암치료 AI 가이드 플랫폼 — 기획 및 설계 문서

> 최초 작성: 2026-05-14 / 최종 업데이트: 2026-05-15
> 상태: **DB 구축 완료 ✅ / MVP 구현 완료 ✅ / 보호자 뷰 + 공유 시스템 구현 완료 ✅**

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
  icon: <Pill />,
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
    oncology-sidebar.tsx
    oncology-desktop-sidebar.tsx
    oncology-date-selector.tsx
    oncology-register-dialog.tsx
    oncology-case-button.tsx
    mobile/
      mobile-oncology-sidebar.tsx
      mobile-oncology-sidebar-sheet.tsx
```

---

### 4. 내부 Footer

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
]
```

---

### 전체 레이아웃 구조 (`[target_date]/layout.tsx`)

```tsx
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
| **파일 업로드** | 진단서 PDF / JPG / PNG (최대 5MB) 업로드 → Claude AI 분석 → 임상증상·경과·추가정보 + 보호자 안내문 자동 채움 |
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
      ├─ 보호자 안내문(owner_note) → onco_diagnosis_inputs (input_type='text').additional_notes에 upsert
      └─ { clinical_signs, clinical_course, raw_text, owner_note } 반환 → 폼 자동 채움
```

> **보호자 안내문 (`owner_note`)**: 보호자 눈높이에 맞춘 2–4문단 한국어 설명.  
> 진단 경위, 진단명·질환 설명, 치료 방향이 포함됨.  
> `onco_diagnosis_inputs` 테이블의 `(case_id, input_type='text')` 행의 `additional_notes` 컬럼에 저장됨.

→ 이 내용을 바탕으로 AI 항암 프로토콜 제시 시작

---

## DB 테이블 구조 — ✅ Supabase 적용 완료

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
        └── onco_qol_records

onco_ai_cache    (AI 응답 캐시 — 병원 공용)
```

> `onco_report_tokens` 테이블은 설계 단계에서 제거됨.  
> 보호자 공유는 기존 `resource_shares` 시스템을 활용 (아래 공유 시스템 섹션 참조).

---

### ① onco_cases — 케이스 마스터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| hos_id | uuid FK | hospitals(hos_id) |
| patient_id | uuid FK | patients(patient_id) |
| diagnosis_name | text NOT NULL | "Lymphoma (B-cell, Multicentric)" |
| diagnosis_category | text[] | 복수선택: `'{lymphoma,mct}'` |
| diagnosis_method | text[] | 복수선택: `'{fna,biopsy}'` |
| stage | text | "Stage III" (자유 텍스트) |
| age_at_diagnosis_days | integer | 일(day) 단위 — UI: `Xy Xm` 표기 |
| body_weight | numeric(5,2) | 진단 시점 체중 kg |
| sex | text | `male` \| `female` \| `male_neutered` \| `female_neutered` |
| status | text | `active` \| `completed` \| `discontinued` \| `deceased` |
| case_date | date | |
| vet_id | uuid FK | 담당 수의사 users(user_id) |
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
| additional_notes | text | **`input_type='text'` 행**: 보호자 안내문 저장 / **`input_type='document'` 행**: 업로드 파일 목록 JSON |

> UNIQUE: `(case_id, input_type)` — 케이스당 text 1개, document 1개 (upsert)  
> `input_type='text'` 행과 `input_type='document'` 행은 별도 행이므로 `additional_notes` 용도 충돌 없음.

---

### ③ onco_protocols — 프로토콜 템플릿

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| hos_id | uuid FK nullable | NULL이면 공용 템플릿 |
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
| owner_instructions | text | 보호자 안내 (분리) |
| owner_warning_signs | jsonb | 즉시 내원 기준 증상 목록 |
| ref_sources | jsonb | 참고 문헌 (`references`는 PG 예약어라 변경) |
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

---

### ⑤ onco_case_protocols — 케이스-프로토콜 연결

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| protocol_id | uuid FK | RESTRICT (참조 보호) |
| initial_body_weight | numeric(5,2) NOT NULL | 스케줄 최초 생성 기준 체중 |
| start_date | date | |
| end_date | date | |
| status | text | `active` \| `completed` \| `discontinued` |
| discontinue_reason | text | |
| total_doses | integer | 자동 집계 |
| completed_doses | integer | |
| delayed_doses | integer | |
| reduced_doses | integer | |

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
| body_weight_at_visit | numeric(5,2) | 해당 회차 실측 체중 (kg) |
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
| event_type | text | "neutropenia" \| "구토/메스꺼움" 등 |
| vcog_grade | integer | 1 ~ 5 (보호자 기록 시 1 고정) |
| description | text | |
| action_taken | text | 투약 중단 / 감량 / 지지치료 등 |
| resolved | boolean | |
| resolved_date | date | |
| **reported_by** | text | **`vet` \| `owner`** — 기록 주체 구분 |

> `reported_by='owner'` 기록은 보호자 뷰에서 직접 입력.  
> 보호자 용어(구토/메스꺼움, 기력저하 등)가 DB 저장값으로 사용되며, 수의사 UI에서도 동일하게 표시됨.

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

### ⑨ onco_qol_records — QoL 트래킹 (HHHHHMM Scale)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| visit_date | date | |
| body_weight | numeric(5,2) | kg |
| pain_score | integer | 1~10 (Hurt) |
| hunger_score | integer | 1~10 (Hunger) |
| hydration_score | integer | 1~10 (Hydration) |
| hygiene_score | integer | 1~10 (Hygiene) |
| happiness_score | integer | 1~10 (Happiness) |
| mobility_score | integer | 1~10 (Mobility) |
| good_days_score | integer | 1~10 (More Good Days) |
| nausea_vomiting_days | integer | 이번 주 구토/메스꺼움 일수 (0–7) |
| lethargy_days | integer | 이번 주 기력 저하 일수 (0–7) |
| behavior_checklist | jsonb | 행동 체크리스트 (스키마 아래 참조) |
| reported_by | text | `vet` \| `owner` \| `both` |
| notes | text | |

**총점 계산**: 7개 항목 합산 / 70점 만점  
- 50점 이상: 양호 (emerald)  
- 35~49점: 경계 (amber)  
- 35점 미만: 불량 (red)

#### behavior_checklist JSONB 스키마
```jsonc
{
  "plays_normally": true,       // 좋아하는 활동이나 놀이에 참여
  "social_interaction": true,   // 가족과 잘 어울림
  "normal_sleep": true,         // 수면 정상
  "toilet_normal": true,        // 대소변 정상
  "grooming_normal": true,      // 털 관리 스스로 함
  "shows_interest": true,       // 주변 환경에 관심
  "pain_vocalization": false    // 아파서 신음 (inverted — true면 경고)
}
```

---

## 화면 구조 (수의사 탭 기반)

```
케이스 상세 페이지 (oncology-case-client.tsx)
├── [보호자 뷰] 버튼 (indigo, Users 아이콘) → owner-case-dialog 전체화면 다이얼로그
│
├── Tab 1: 진단 & AI 가이드
│     - 진단 문서 업로드 (PDF/JPG/PNG, 5MB 이하) → AI 임상정보 + 보호자 안내문 자동 추출
│     - 직접 텍스트 입력 (임상증상 / 임상경과 / 직접입력)
│     - 보호자 안내문 편집 영역 (additional_notes, indigo 스타일)
│     - 케이스 기본 정보 편집 (체중/병기/성별/상태/진단방법)
│     - AI 프로토콜 추천 (onco_ai_cache 90일 캐시)
│     - 캐시 만료 시 기존 가이드 유지 or 새 추천 선택 UX
│
├── Tab 2: 프로토콜 & 스케줄
│     - 프로토콜 선택 (AI 제안 or 수동 작성)
│     - 체중 기반 투약량 자동 계산 (initial_body_weight)
│     - 전체 기간 투약 스케줄 테이블 자동 생성 (onco_schedules)
│
├── Tab 3: 투약 기록
│     - 회차별 완료 체크 + 실측 체중 입력
│     - 연기/감량 기록 및 사유, 전체 수행률(%) 표시
│
├── Tab 4: 부작용 모니터링
│     - VCOG-CTCAE Grade 1~5 기록 (reported_by: vet/owner 구분 표시)
│
├── Tab 5: 치료 반응 평가
│     - CR / PR / SD / PD 기록 (onco_response_evals)
│
└── Tab 6: QoL 트래킹
      - HHHHHMM 7개 항목 슬라이더 (1~10점, 총 70점)
      - 행동 체크리스트, 주간 증상 빈도
      - 총점 추세 (TrendingUp/Down), reported_by 표시
```

---

## 보호자 뷰 (Owner View)

### 진입 경로

1. **수의사 내부**: `oncology-case-client.tsx` 액션 버튼 영역의 "보호자 뷰" 버튼 → 전체화면 다이얼로그
2. **공유 URL**: `/shared/[share_id]` (resource_type='oncology_owner')
3. **컬렉션 공유**: `/shared/[share_id]` (resource_type='collection') 내 항목으로 포함

### 파일 구조

```
components/hospital/oncology/oncology_owner/
  owner-case-dialog.tsx         → 전체화면 다이얼로그 (수의사용, 공유/컬렉션 버튼 포함)
  owner-tab1-info.tsx           → 환자 기본 정보 + 보호자 안내문
  owner-tab2-schedule.tsx       → 항암 스케줄 (완료율 + 사이클별 약물/상태, read-only)
  owner-tab3-adverse.tsx        → 증상 기록 (보호자 추가 가능, readOnly/usePublicAction prop)
  owner-tab4-qol.tsx            → 컨디션 기록 (HHHHHMM 폼, readOnly/usePublicAction prop)
  owner-adverse-create-dialog.tsx → 증상 추가 다이얼로그 (usePublicAction prop)

app/shared/[share_id]/_components/
  shared-oncology-owner-view.tsx  → 서버 컴포넌트, fetchOncologyCaseDetailAdmin 호출
  shared-owner-tabs-client.tsx    → 클라이언트 탭 컴포넌트 (보호자 쓰기 가능)
```

### 보호자 뷰 탭 구성

| 탭 | 내용 | 보호자 쓰기 |
|----|------|------------|
| Tab 1 — 기본 정보 | 환자 프로필 (종, 품종, 나이, 체중, 성별, 보호자명) + 진단명/병기 + 보호자 안내문 | ❌ |
| Tab 2 — 항암 스케줄 | 전체 완료율 프로그레스바 + 사이클별 날짜/약물명/상태 배지 | ❌ |
| Tab 3 — 증상 모니터링 | 이상 증상 기록 목록 + 추가 버튼 (보호자 용어 사용) | ✅ |
| Tab 4 — 컨디션 기록 | HHHHHMM 슬라이더 폼 + 기존 기록 목록 + 수정 | ✅ |

### 보호자 증상 추가 — 용어 매핑

보호자 UI에 표시되는 용어와 DB 저장값:

| 보호자 표시 | DB 저장값 (`event_type`) |
|------------|------------------------|
| 구토 / 메스꺼움 | 구토/메스꺼움 |
| 설사 | 설사 |
| 식욕 감소 | 식욕감소 |
| 기력 저하 / 무기력 | 기력저하 |
| 털 빠짐 | 털빠짐 |
| 체중 감소 | 체중감소 |
| 발열 | 발열 |
| 호흡 이상 | 호흡이상 |
| 출혈 | 출혈 |
| 기타 | 기타 |

> 보호자 기록은 `reported_by='owner'`, `vcog_grade=1` 고정으로 저장됨.

---

## 공유 시스템

### 구조 개요

항암 보호자 뷰는 기존 `resource_shares` 시스템을 그대로 활용한다.  
별도 `onco_report_tokens` 테이블 없이 통합 공유 인프라 사용.

```
resource_shares 테이블
  resource_type = 'oncology_owner'
  resource_id   = onco_cases.id
```

**지원되는 ShareResourceType** (`types/share/share-type.ts`):
```ts
type ShareResourceType = 'note' | 'icu' | 'monitoring' | 'collection' | 'dental' | 'oncology_owner'
```

**지원되는 CollectionResourceType** (`types/collections/collection-type.ts`):
```ts
type CollectionResourceType = 'note' | 'monitoring' | 'icu' | 'oncology_owner'
```

### 개별 URL 공유 흐름

```
수의사 → owner-case-dialog의 "공유" 버튼 (indigo)
       → ShareResourceDialog (resourceType='oncology_owner', resourceId=caseId)
       → resource_shares 테이블에 레코드 생성
       → /shared/[share_id] URL 생성

보호자 → URL 접근 (비로그인)
       → shared/[share_id]/page.tsx
       → resource_type='oncology_owner' 감지
       → SharedOncologyOwnerView (서버 컴포넌트)
           → fetchOncologyCaseDetailAdmin() (admin client, RLS 우회)
           → SharedOwnerTabsClient (클라이언트, 4탭)
               → Tab3/Tab4: usePublicAction=true (admin client 서버 액션 사용)
```

### 컬렉션 포함 공유 흐름

```
수의사 → owner-case-dialog의 "컬렉션" 버튼 (slate)
       → AddToCollectionDialog (resourceType='oncology_owner', resourceId=caseId)
       → resource_collection_items 테이블에 추가

컬렉션 공유 URL → shared-collection-view.tsx
  → oncology_owner 항목 감지
  → SharedOncologyOwnerView 렌더링
```

### 공유 URL에서의 보호자 쓰기

공유 URL은 비로그인(anon) 상태이므로 일반 서버 액션(`createClient()` 기반)은 RLS에 의해 차단됨.  
보호자 쓰기 전용 admin client 액션을 별도 제공:

| 일반 액션 (수의사용) | Public 액션 (보호자 공유 URL용) |
|-------------------|-------------------------------|
| `saveAdverseEvent()` | `saveAdverseEventPublic()` |
| `saveQolRecord()` | `saveQolRecordPublic()` |
| `updateQolRecord()` | `updateQolRecordPublic()` |

- Public 액션은 `createAdminClient()` 사용, `revalidatePath` 미호출 (세션 없음)
- `usePublicAction` prop으로 컴포넌트 내 액션 분기
- `SharedOwnerTabsClient`에서 `usePublicAction={true}` 전달 → 보호자 공유 URL에서만 public 액션 사용

### 병원 내부 컬렉션 뷰에서의 항암 보호자 뷰

```
app/hospital/[hos_id]/collections/[collection_id]/page.tsx
  → oncology_owner 아이템 감지
  → onco_cases 테이블에서 patient_name + diagnosis_name 조회 (resourceMap에 추가)
  → CollectionItemRow에 resourceData 전달

components/hospital/collections/collection-detail/collection-item-row.tsx
  → isOncology 감지 → 클릭 시 handleOpenOncology (lazy fetch)
  → Dialog에 SharedOwnerTabsClient 렌더링
  → 행: indigo 컬러 + Heart 아이콘 + "항암 보호자 뷰" 라벨
```

---

## RLS (Row Level Security)

| 역할 | 읽기 | 쓰기/수정/삭제 |
|------|------|---------------|
| `authenticated` | 같은 병원(`hos_id`) 데이터 전체 | 같은 병원 데이터만 |
| `anon` | ❌ (직접 접근 불가) | ❌ |
| **서버 admin client** | 전체 (RLS 우회) | 전체 (RLS 우회) |

- 공유 URL의 읽기/쓰기는 모두 `createAdminClient()` 기반 서버 코드에서 처리
- 헬퍼 함수 `get_my_hos_id()` 사용 — `auth.uid()` → `users.hos_id` 반환
- `onco_protocols`: `hos_id IS NULL`(공용)도 authenticated 읽기 허용
- `onco_ai_cache`: 모든 병원이 공유하는 캐시 — authenticated 전체 읽기/쓰기

---

## 개발 단계

### 1단계 — MVP ✅ 완료 (2026-05-14)

**DB 및 기반:**
- [x] DB 설계 확정 (9개 테이블, onco_report_tokens 제거)
- [x] Supabase SQL 실행 + RLS 정책 적용
- [x] `database.types.ts` 업데이트
- [x] `types/hospital/oncology-type.ts` 작성

**네비게이션:**
- [x] `HOS_SIDEBAR_MENUS`에 `항암(oncology)` 항목 추가
- [x] 라우팅 구조 전체 구현 (redirect, layout, page, search)
- [x] sidebar, footer, context provider 구현

**케이스 차트 (수의사용):**
- [x] Tab 1~6 전체 구현
- [x] 서비스/액션 레이어 전체 구현
- [x] AI 가이드 캐시 만료 UX
- [x] 진단 문서 업로드 + AI 추출

---

### 2단계 — 보호자 뷰 + 공유 시스템 ✅ 완료 (2026-05-15)

**보호자 안내문 (Tab 1):**
- [x] `onco_diagnosis_inputs (input_type='text').additional_notes` 에 보호자 안내문 저장
- [x] AI 문서 추출 시 `owner_note` 자동 생성 + 저장
- [x] Tab 1 UI에 보호자 안내문 편집 영역 추가

**DB 변경:**
- [x] `onco_adverse_events.reported_by` 컬럼 추가 (`vet` | `owner`)
- [x] `onco_qol_records` HHHHHMM 스케일로 전면 개편 (7개 항목 × 10점, behavior_checklist JSONB, nausea_vomiting_days, lethargy_days, reported_by)

**보호자 뷰 컴포넌트:**
- [x] `owner-case-dialog.tsx` — 전체화면 다이얼로그 (공유/컬렉션 버튼 포함)
- [x] `owner-tab1-info.tsx` — 환자 정보 + 보호자 안내문
- [x] `owner-tab2-schedule.tsx` — 완료율 + 사이클별 스케줄 (read-only)
- [x] `owner-tab3-adverse.tsx` — 증상 기록 (readOnly / usePublicAction prop)
- [x] `owner-tab4-qol.tsx` — HHHHHMM 폼 (readOnly / usePublicAction prop)
- [x] `owner-adverse-create-dialog.tsx` — 보호자 용어 → DB 값 매핑

**공유 시스템 통합:**
- [x] `types/share/share-type.ts` — `oncology_owner` 타입 추가
- [x] `types/collections/collection-type.ts` — `oncology_owner` 타입 추가
- [x] `app/shared/[share_id]/page.tsx` — oncology_owner 라우팅 추가
- [x] `shared-oncology-owner-view.tsx` — 서버 컴포넌트 (admin client)
- [x] `shared-owner-tabs-client.tsx` — 클라이언트 탭 (usePublicAction=true)
- [x] `shared-collection-view.tsx` — oncology_owner 항목 지원
- [x] `lib/services/oncology/fetch-oncology-case.ts` — `fetchOncologyCaseDetailAdmin()` 추가

**보호자 공유 URL 쓰기 지원:**
- [x] `saveAdverseEventPublic()` — admin client 버전
- [x] `saveQolRecordPublic()` — admin client 버전
- [x] `updateQolRecordPublic()` — admin client 버전

**컬렉션 내부 뷰:**
- [x] `collection-item-row.tsx` — oncology_owner 클릭 → lazy fetch → Dialog
- [x] `collections/[collection_id]/page.tsx` — onco_cases 조회 추가

---

### 3단계 — 임상 분석
- [ ] 혈액검사(CBC/Chemistry) 기반 투약 가능 여부 자동 판단
- [ ] 병원 내 케이스 분석 대시보드
- [ ] 치료 반응 / QoL 변화 그래프 시각화

### 4단계 — 병원 간 공유
- [ ] 병원 간 익명 데이터 공유 플랫폼
- [ ] 종양 종류 / 종별 / 품종별 비교 분석

---

## 기술 고려사항

| 항목 | 내용 |
|------|------|
| AI 모델 | Anthropic Claude API (cytology AI와 동일 패턴) |
| AI 응답 형식 | 표준화된 JSONB 스키마로 받아 `onco_protocols` + `onco_ai_cache`에 저장 |
| 파일 처리 | Supabase Storage (`oncology-documents` 버킷) + AI 텍스트 추출 |
| 경구/주사 분기 | `drugs[].is_oral` + `route` → 스케줄 생성 로직 분기 |
| 수의사 검수 | `is_verified` 플래그 + 미검수 시 UI 경고 배너 |
| VCOG-CTCAE | 상수 파일(`constants/hospital/oncology/vcog-ctcae.ts`)로 내장 예정 |
| 보호자 공유 | `resource_shares` 통합 시스템 사용 (별도 토큰 테이블 없음) |
| 공유 URL 쓰기 | `createAdminClient()` 기반 Public 서버 액션으로 RLS 우회 |
| QoL 스케일 | HHHHHMM (Hurt/Hunger/Hydration/Hygiene/Happiness/Mobility/More Good Days), 7항목 × 10점 |
| FK 타입 | `hos_id`, `patient_id`, `user_id` 모두 UUID (Supabase 실제 타입 기준) |
| PG 예약어 주의 | `references` → `ref_sources`로 변경 |

> **인프라 메모**: `oncology-documents` Supabase Storage 버킷 생성 필요.  
> 미생성 시 파일 저장만 실패하고 AI 추출은 정상 동작함.
