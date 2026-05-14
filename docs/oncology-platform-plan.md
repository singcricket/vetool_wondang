# 수의 항암치료 AI 가이드 플랫폼 — 기획 및 설계 문서

> 작성일: 2026-05-14  
> 상태: **설계 완료 / 구현 대기**

---

## 프로젝트 개요

수의사가 항암치료를 수행할 때, 진단부터 치료 종료까지 전 과정을 AI가 가이드하고,  
치료 데이터를 축적하여 병원 간 공유가 가능한 수의 종양학 임상 지원 플랫폼.

**FNA 또는 조직검사를 통해 악성 종양이 확진된 시점부터 시스템이 작동한다.**

---

## 네비게이션 구조

- Main sidebar → `/oncology` 진입
- oncology 내부 sidebar: 기존 환자 / 신규 환자 등록 (ophthalmic, cytology 패턴 동일)
- 환자 연결: 기존 `patients` 테이블 FK

---

## 케이스 시작 — 진단 입력 2가지 옵션

| 방법 | 설명 |
|------|------|
| **파일 업로드** | 조직검사/FNA 결과 PDF 또는 TXT 업로드 → AI 텍스트 추출 |
| **직접 입력** | 진단명, 임상 증상, 경과 직접 텍스트 입력 |

→ 이 내용을 바탕으로 AI 항암 프로토콜 제시 시작

---

## DB 테이블 구조 (9개)

### 관계도

```
patients
  └── onco_cases
        ├── onco_diagnosis_inputs
        ├── onco_case_protocols
        │     └── onco_schedules
        ├── onco_adverse_events
        ├── onco_response_evals
        └── onco_qol_records

onco_protocols   (재사용 가능한 프로토콜 템플릿 — AI 생성/수동 공존)
onco_ai_cache    (AI 응답 캐시)
```

---

### ① onco_cases — 케이스 마스터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| hos_id | text FK | |
| patient_id | uuid FK | patients 테이블 |
| diagnosis_name | text | "Lymphoma (B-cell, Multicentric)" |
| diagnosis_category | text | "lymphoma" \| "mct" \| "osa" \| "hsa" 등 |
| diagnosis_method | text | "fna" \| "biopsy" \| "cytology" \| "clinical" |
| stage | text | "Stage III" (자유 텍스트) |
| body_weight | numeric | 진단 시점 체중 (kg) |
| age_years | numeric | |
| sex | text | "male" \| "female" \| "male_neutered" \| "female_neutered" |
| status | text | "active" \| "completed" \| "discontinued" \| "deceased" |
| case_date | date | |
| notes | text | |
| created_by | text FK | users.user_id |

---

### ② onco_diagnosis_inputs — 진단 자료

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| input_type | text | "file" \| "text" |
| file_url | text | Supabase Storage URL |
| file_name | text | |
| file_type | text | "pdf" \| "txt" \| "image" |
| raw_text | text | 직접 입력 텍스트 |
| ai_extracted_text | text | AI가 파일에서 추출한 텍스트 |
| clinical_signs | text | 임상 증상 |
| clinical_course | text | 경과 |
| additional_notes | text | |

---

### ③ onco_protocols — 프로토콜 템플릿

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| hos_id | text FK nullable | null이면 공용 템플릿 |
| diagnosis_key | text | 캐시 키 (예: "canine_lymphoma_b_cell") |
| protocol_name | text | "CHOP", "CCNU" 등 |
| protocol_type | text | "chemo" \| "surgery" \| "radiation" \| "multimodal" |
| phase | text | "induction" \| "maintenance" \| "rescue" \| "adjuvant" |
| total_cycles | integer | |
| total_weeks | integer | |
| description | text | 프로토콜 설명 |
| mst_days | integer | Median Survival Time (일) |
| response_rate | numeric | 0.0 ~ 1.0 |
| drugs | jsonb | 약물 목록 (아래 스키마 참조) |
| surgery_details | jsonb | 수술 정보 (해당 시) |
| radiation_details | jsonb | 방사선 정보 (해당 시) |
| precautions | text | 일반 주의사항 |
| drug_interactions | jsonb | 약물 상호작용 목록 |
| adverse_effects | jsonb | 부작용 목록 |
| contraindications | text | 금기 사항 |
| owner_instructions | text | **보호자 안내 (분리)** |
| owner_warning_signs | jsonb | **즉시 내원 기준 증상 목록** |
| references | jsonb | 참고 문헌 |
| is_ai_generated | boolean | |
| ai_model_version | text | |
| is_verified | boolean | 수의사 검수 완료 여부 |
| version | integer | 버전 번호 |

#### drugs JSONB 스키마 (배열)
```jsonc
[
  {
    "drug_name": "Vincristine",
    "drug_class": "Vinca alkaloid",
    "route": "iv",                  // "oral" | "iv" | "sc" | "im"
    "dose_value": 0.7,
    "dose_unit": "mg/m2",           // "mg/kg" | "mg/m2" | "fixed_mg"
    "frequency": "q7d",             // "q24h" | "q48h" | "q7d" | "q14d" | "q21d" | "q28d"
    "cycle_day": 1,                 // 사이클 내 투약 일차
    "duration_days": 1,
    "is_oral": false,
    "precautions": "...",
    "adverse_effects": "...",
    "contraindications": "...",
    "owner_instructions": "..."     // 경구제의 경우 집에서 투약 주의사항
  }
]
```

#### surgery_details JSONB 스키마
```jsonc
{
  "surgery_type": "Excision",
  "timing": "before_chemo",         // "before_chemo" | "after_chemo" | "concurrent"
  "notes": "..."
}
```

#### radiation_details JSONB 스키마
```jsonc
{
  "total_dose_gy": 48,
  "fraction_count": 16,
  "fraction_schedule": "3회/주",
  "technique": "IMRT",
  "timing": "after_chemo"
}
```

#### drug_interactions JSONB 스키마 (배열)
```jsonc
[{ "drug_a": "...", "drug_b": "...", "severity": "major", "description": "..." }]
```

#### adverse_effects JSONB 스키마 (배열)
```jsonc
[{ "name": "Neutropenia", "vcog_grade": 3, "frequency": "common", "description": "..." }]
```

---

### ④ onco_ai_cache — AI 응답 캐시

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| diagnosis_key | text | |
| query_type | text | "treatment_options" \| "protocol_detail" |
| protocol_name | text nullable | protocol_detail 조회 시 |
| response_json | jsonb | 표준화된 AI 응답 전문 |
| model_version | text | |
| version | integer | |
| is_active | boolean | |
| created_at | timestamptz | |
| expires_at | timestamptz | |

**UNIQUE**: `(diagnosis_key, query_type, protocol_name, version)`

---

### ⑤ onco_case_protocols — 케이스-프로토콜 연결

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| protocol_id | uuid FK | |
| body_weight | numeric | 투약량 계산용 체중 (kg) |
| start_date | date | |
| end_date | date | |
| status | text | "active" \| "completed" \| "discontinued" |
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
| drug_route | text | "oral" \| "iv" \| "sc" \| "im" |
| dose_per_kg | numeric | mg/kg |
| dose_per_m2 | numeric | mg/m² |
| dose_unit | text | "mg/kg" \| "mg/m2" \| "fixed_mg" |
| dose_calculated | numeric | mg (체중 기반 계산값) |
| status | text | "scheduled" \| "completed" \| "delayed" \| "skipped" \| "reduced" |
| dose_actual | numeric | 실제 투약량 (mg) |
| administered_at | timestamptz | |
| administered_by | text FK | |
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
| drug_name | text | 원인 약물 |
| event_type | text | "neutropenia" \| "vomiting" \| "anorexia" 등 |
| vcog_grade | integer | 1 ~ 5 |
| description | text | |
| action_taken | text | 투약 중단, 용량 감량, 지지 치료 등 |
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
| modality | text | "xray" \| "ultrasound" \| "ct" \| "physical_exam" |
| response_type | text | "CR" \| "PR" \| "SD" \| "PD" |
| measurement_before | numeric | mm |
| measurement_after | numeric | mm |
| notes | text | |
| image_urls | jsonb | |

---

### ⑨ onco_qol_records — QoL 트래킹

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| case_id | uuid FK | |
| visit_date | date | |
| body_weight | numeric | kg |
| vitality_score | integer | 1 ~ 5 |
| appetite_score | integer | 1 ~ 5 |
| owner_score | integer | 1 ~ 5 |
| notes | text | |

---

## 화면 구조 (탭 기반)

```
케이스 상세 페이지
├── Tab 1: 진단 & AI 가이드
│     - 파일 업로드(PDF/TXT) 또는 직접 텍스트 입력
│     - AI → 치료 옵션 목록, MST, 참고 문헌 출력
│     - AI 응답 캐시(onco_ai_cache) 활용
│     - 수의사 검수/승인 단계
│
├── Tab 2: 프로토콜 & 스케줄
│     - 프로토콜 선택 (AI 제안 or 수동)
│     - 경구/주사 구분, 투약 간격 자동 반영
│     - 체중 기반 투약량 자동 계산
│     - 전체 기간 투약 스케줄 테이블 자동 생성
│     - 수술/방사선 옵션 포함 (세부 내용 2단계)
│
├── Tab 3: 투약 기록
│     - 회차별 완료 체크
│     - 연기/감량 기록 및 사유
│     - 전체 수행률(%) 표시
│     - Dose Intensity 계산
│
├── Tab 4: 부작용 모니터링
│     - VCOG-CTCAE Grade 1~5 기록
│     - 혈액검사(CBC/Chemistry) 기반 투약 가능 여부 판단 (2단계)
│
├── Tab 5: 치료 반응 평가
│     - CR / PR / SD / PD 기록
│     - Rescue Protocol 제시 (PD 시)
│
└── Tab 6: QoL 트래킹
      - 매 내원 체중, 활력, 식욕, 보호자 평가
      - 전체 기간 QoL 변화 그래프
```

---

## 개발 단계

### 1단계 — MVP (다음 작업)
- [ ] Supabase SQL 실행 (9개 테이블)
- [ ] `database.types.ts` 업데이트
- [ ] `types/hospital/oncology-type.ts` 작성
- [ ] Main sidebar에 `/oncology` 메뉴 추가
- [ ] 라우팅 구조 (`app/hospital/[hos_id]/oncology/`)
- [ ] 케이스 목록 + 신규 케이스 생성 UI
- [ ] Tab 1: 진단 입력 (파일 업로드 / 직접 입력)
- [ ] Tab 1: AI 치료 옵션 제시 + DB 캐싱
- [ ] Tab 2: 프로토콜 선택 + 투약 스케줄 자동 생성
- [ ] Tab 3: 투약 기록 체크

### 2단계
- [ ] 부작용 VCOG-CTCAE 기록 UI
- [ ] 혈액검사 기반 투약 가능 여부 자동 판단
- [ ] 보호자 안내문 자동 생성 (Claude API)

### 3단계
- [ ] AI 캐시 버전 관리 + 갱신 UI
- [ ] 병원 내 케이스 분석 대시보드

### 4단계
- [ ] 병원 간 익명 데이터 공유 플랫폼
- [ ] 종양 종류 / 종별 / 품종별 비교 분석

---

## 기술 고려사항

| 항목 | 내용 |
|------|------|
| AI 모델 | Anthropic Claude API (cytology AI와 동일 패턴) |
| AI 응답 형식 | 표준화된 JSONB 스키마로 받아 DB 저장 |
| 파일 처리 | Supabase Storage + AI 텍스트 추출 |
| 경구/주사 분기 | `drugs[].is_oral` + `route` → 스케줄 생성 로직 분기 |
| 수의사 검수 | `is_verified` 플래그 + 미검수 시 UI 경고 |
| VCOG-CTCAE | 상수 파일로 내장 예정 |
| 보호자 안내 | `owner_instructions` + `owner_warning_signs` 별도 필드 |
| 출처 표시 | `references` JSONB 필드 → UI에 항상 표시 |
