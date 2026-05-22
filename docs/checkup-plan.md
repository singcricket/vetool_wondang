# 건강검진 플랫폼 계획서

**작성일**: 2026-05-21  
**상태**: 설계 중

---

## 1. 개요

반려동물 건강검진 결과를 체계적으로 입력·분석하고, 보호자에게 전문적인 리포트를 제공하는 플랫폼.

- 수의사: 검진 데이터 입력 → AI 종합소견 생성 → 승인 → 리포트 공유
- 보호자: URL 링크 또는 PDF로 검진 결과 확인

---

## 2. 검진 대분류

| 대분류 | 소분류 |
|--------|--------|
| 문진 | 주증상, 병력, 생활환경, 현재 약물 |
| 신체검사 | 일반검사, 신경계, 관절, 안과 |
| 임상병리 | 혈액검사, 특수검사, 내분비, 요검사, 체강액 |
| 영상검사 | 방사선, 초음파, 내시경, CT, MRI |

---

## 3. 입력 UI 구조

### 탭 구성 (B안 — 기능별)

| 탭 | 포함 내용 |
|----|-----------|
| 문진·신체검사 | 주증상/병력(S) + 신체검사 항목(O-physical) |
| 검사결과 | 임상병리(O-labs) + 영상검사(O-imaging) |
| 평가·계획 | 문제목록/진단/감별(A) + 치료계획(P) |
| 종합소견 | AI 분석 결과 + 수의사 검토·승인 |

### 검진 상태 흐름

```
draft → reviewing → approved
```

- `approved` 상태가 되어야 리포트 뷰 활성화 및 공유 가능

### Hub 모델 — 서브차트 연동

건강검진 진행 중 아래 전문 모듈을 호출하여 서브차트 생성:

- 치과검진 → `dental` 차트
- 심장초음파 → `echocardio` 차트
- 복부초음파 → `ultrasound` 차트
- 신경계검사 → `neuro` 차트

생성된 서브차트의 결과는 건강검진 레코드에 참조(reference)로 연결.

---

## 4. 데이터 입력 방식

### 임상병리 — PDF AI 추출

1. 병원 장비에서 출력된 검사 결과 PDF 업로드
2. AI가 PDF를 파싱하여 항목명, 수치, **참고범위**를 함께 추출
3. ref 파일의 `aiExtractKeywords`로 항목 매핑
4. 추출 결과를 수의사가 수정/보완 후 저장

> 참고범위는 병원 장비마다 다르므로 PDF에서 추출한 값을 그대로 사용 (ref 파일에 고정하지 않음)

### 임상병리 ref 파일 구조

```ts
interface LabRefItem {
  id: string                // 'ast', 'alt', 'bun', ...
  nameKo: string            // '아스파르테이트 아미노전이효소'
  nameEn: string            // 'AST'
  unit: string              // 'U/L'
  section: string[]         // ['chemistry', 'liver'] — 복수 소속 가능
  comment: {
    increase: string        // 상승 시 임상적 의미/원인
    decrease: string        // 감소 시 임상적 의미/원인
    normal?: string         // 정상 해석 메모 (선택)
  }
  aiExtractKeywords?: string[]  // PDF 매핑용 키워드
}
```

### 이미지 입력

- 섹션별 이미지 업로드 가능 (신체검사, 영상검사 등)
- 업로드 시 태그(tag) 부여 → 리포트 특정 페이지에 자동 배치
- 태그 예시: `['xray', 'thorax']` → 리포트 '영상검사' 페이지에 노출

### AI 종합소견 생성

- 모든 입력 완료 후 수동으로 AI 분석 트리거
- AI 생성 항목:
  - 종합소견 (Comprehensive Summary)
  - 주요 이상소견 (Abnormal Findings)
  - 체중·영양 관리 권고
  - 모니터링 및 재검 권고 항목
- 생성 결과는 수의사가 직접 수정/보완 가능
- 수정 후 승인(approved) → 리포트 확정

---

## 5. 리포트 UI

### 설계 원칙

- 입력 UI와 리포트 UI 완전 분리
- 리포트는 PDF/PPTX 출력에 최적화된 페이지 기반 레이아웃
- 보호자용 공개 범위: 종합소견, 이상소견, 권고사항, 이미지 (수치 원본 미포함)

### 리포트 페이지 구성

| 페이지 | 내용 | 이미지 태그 |
|--------|------|-------------|
| 표지 | 환자 정보, 검진일, 병원 정보 | — |
| 신체검사 | 체중, BCS, TPR, 검사 소견 | `physical` |
| 혈액검사 | 검진 항목 전체 수치 표시, 이상 항목 강조, AI 해석 결과 | — |
| 영상검사 | 방사선/초음파 소견 + 이미지 | `xray`, `ultrasound`, `ct`, `mri`, `endoscopy` |
| 종합소견 | AI 분석 + 수의사 코멘트 | — |
| 권고사항 | 체중관리, 모니터링, 재검 일정 | — |

### 공유 방식

기존 `resource_shares` 시스템 활용:
- `resource_type: 'checkup'` 추가
- `/shared/[share_id]` → `SharedCheckupView` 컴포넌트
- 승인(approved) 상태에서만 공유 링크 생성 가능

---

## 6. DB 스키마 (B안 — 메타 + JSONB 혼합)

```sql
-- 검진 메타
checkup_records (
  id uuid PRIMARY KEY,
  hos_id uuid REFERENCES hospitals(hos_id),
  patient_id uuid,
  vet_id uuid,
  checkup_date date NOT NULL,
  status text CHECK ('draft', 'reviewing', 'approved'),
  sub_charts jsonb,           -- { dental_id, echo_id, ultrasound_id, neuro_id }
  created_at timestamptz,
  updated_at timestamptz
)

-- 섹션별 데이터
checkup_sections (
  id uuid PRIMARY KEY,
  checkup_id uuid REFERENCES checkup_records(id) ON DELETE CASCADE,
  section_type text CHECK ('inquiry', 'physical', 'lab', 'imaging', 'assessment', 'plan'),
  data jsonb NOT NULL DEFAULT '{}',
  images jsonb DEFAULT '[]',  -- [{ url, tag[], caption }]
  updated_at timestamptz
)

-- AI 종합소견
checkup_ai_results (
  id uuid PRIMARY KEY,
  checkup_id uuid REFERENCES checkup_records(id) ON DELETE CASCADE,
  summary text,
  abnormal_findings jsonb,    -- [{ item, value, ref_range, interpretation }]
  weight_advice text,
  monitoring_items jsonb,     -- [{ item, interval, priority }]
  raw_ai_output text,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
```

---

## 7. 라우팅 구조

```
/hospital/[hos_id]/checkup                              ← 검진 목록 (날짜별)
/hospital/[hos_id]/checkup/[target_date]                ← 해당일 검진 목록
/hospital/[hos_id]/checkup/[target_date]/[checkup_id]   ← 검진 입력 UI (탭 4개)
/shared/[share_id]                                      ← 보호자 리포트 (비로그인)
```

---

## 8. 개발 단계

### 1단계 — 기본 입력 구조
- `checkup_records`, `checkup_sections`, `checkup_ai_results` 테이블 생성
- 라우팅 및 목록 페이지
- 입력 UI 4탭 (문진·신체검사, 검사결과, 평가·계획, 종합소견)
- 상태 관리 (draft → reviewing → approved)

### 2단계 — AI 추출 + 이미지
- 임상병리 ref 파일 작성 (혈액, 내분비, 요검사 등)
- PDF AI 추출 → 항목 매핑 → 수정 UI
- 이미지 업로드 + 태그 시스템

### 3단계 — AI 종합소견
- AI 종합소견 생성 (structured output)
- 수의사 수정 + 승인 플로우

### 4단계 — 리포트 + 공유
- 리포트 UI (페이지별 레이아웃)
- PDF 출력
- `resource_shares` 연동 (`resource_type: 'checkup'`)
- `SharedCheckupView` 컴포넌트

### 5단계 — Hub 연동
- 서브차트 생성 연동 (dental, echocardio, ultrasound, neuro, ophthalmic)
- 서브차트 결과 검진 레코드에 참조 연결
