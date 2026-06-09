# 건강검진 리포트 전면 개편 계획

> 작성일: 2026-06-07  
> 기준 문서: 건강검진 계획서_0607.pdf  
> 원칙: 현재 구현 항목 최대 재활용 · 섹션별 순차 진행 · 디자인 일관성 유지

---

## 전체 섹션 구성 (PDF 기준)

| # | 섹션 | 현재 상태 | 우선순위 |
|---|------|-----------|----------|
| 1 | 과거 히스토리 | 탭1 문진에 부분 포함 | 🔴 1순위 |
| 2 | 현재 상태 (주호소·현재증상) | 탭1 문진에 포함 | 🔴 1순위 |
| 3 | 품종별 특성 | AI 생성, 구조화 완료 | 🟡 2순위 (DB 캐싱 미구현) |
| 4 | 연령별 특성 + 사람나이 환산 | **ref 파일 완료** | 🔴 1순위 (리포트 연결 필요) |
| 5 | 신체검사 | 탭2 구현, OrganSection 연결 완료 | 🔴 1순위 (리포트 렌더링 필요) |
| 6 | 체형/BCS + 칼로리 계산 | BCS 입력 있음, 계산기 없음 | 🟡 2순위 |
| 7 | 계통별 평가 | OrganSection 구현, 신체검사 연결 완료 | 🔴 1순위 (렌더링 개선) |
| 8 | 종합 평가 및 관리계획 | 탭5 DxEvaluation 구조 완료 | 🟡 2순위 (Executive Summary 추가) |

---

## 기초 데이터 완료 현황

### ✅ `constants/hospital/checkup/life-stage-ref.ts` (완료)
- 고양이/개 생애단계 정의 (6단계: puppy~geriatric)
- 사람나이 환산 테이블 + `toHumanAge()` 보간 함수
- `getLifeStageFromBirth()` — 생년월일로 단계·사람나이·표시 레이블 반환
- BCS 기반 칼로리 계산 `calcCalories()` (RER/DER, 생활계수 자동 적용)
- 각 단계별 권장 검사 항목 · 주의 질환 · 검진 주기

### ✅ `constants/hospital/checkup/physical-ref.ts` (기존 완성)
- 10개 신체검사 섹션 (vitals, body_condition, hydration, lymph_nodes, cardiovascular, respiratory, abdomen, musculoskeletal, skin, mentation)
- `physicalRefMap` — ID별 참조 데이터

### ✅ `lib/config/checkup-report-modules.ts` — PhysicalFinding 연결 (완료)
- `OrganModuleConfig`에 `physicalIds: string[]` 추가
- 장기계통별 관련 신체검사 ID 매핑:
  - `blood` → mmc, crt, mucous_moisture
  - `liver` → liver_size, abdominal_palpation, abdominal_pain
  - `kidney` → bladder, systolic_bp
  - `pancreas` → abdominal_palpation, abdominal_pain, intestinal_loops
  - `cardio` → heart_rhythm, heart_murmur, murmur_location, pulse_quality, jugular_distension, respiratory_effort, lung_sounds
  - `endocrine` → bcs, mcs, weight_change
  - `metabolism` → bcs, weight_change
  - `electrolyte` → skin_turgor, dehydration_estimate
  - `musculoskeletal` → gait, posture, muscle_atrophy, joint_swelling, spinal_pain, mcs
  - `neuro` → mentation_status, pain_assessment, posture, gait
- `resolveOrganSections()` — physicalData 파라미터 추가, 정상값 필터링, `physicalFindings` 반환

---

## 섹션별 상세 작업 계획

### 🔴 Phase 1 — 리포트 기초 구조 (현재 진행)

#### 1-1. 리포트 헤더 개편
**위치**: `checkup-report.tsx` 상단 헤더  
**추가 내용**:
- 사람나이 환산 표시 ("7세령 ≈ 사람 나이 약 44세")
- 생애단계 배지 (시니어, 프라임 등 — 색상 포함)
- 해당 단계의 권장 검진 주기 표시

**필요 작업**:
- `getLifeStageFromBirth()` 리포트 헤더에 연결

---

#### 1-2. 섹션 1 — 과거 히스토리 + 현재 상태 리포트 렌더링
**데이터 출처**: `checkup_sections.section_type = 'inquiry'`  
**현재**: 탭1에 입력 폼만 있고, 리포트에 `InquirySection`으로 출력 중  
**개편 방향**:

| 항목 | 현재 구현 | 개편 후 |
|------|-----------|---------|
| 주호소 | amber 박스 표시 | 유지 + 과거력 분리 카드 |
| 예방접종/기생충 | 뱃지 표시 | 유지 |
| 식이/생활환경 | 텍스트 표시 | 아이콘 카드로 개편 |
| AI 품종 위험 | 구조화 3분할 | 유지 |
| AI 연령 위험 | 구조화 3분할 | 생애단계 배지 + 권장 검사 연결 |
| AI 관리 포인트 | 구조화 5분할 | 유지 + warning_signs 빨간 카드 강조 |

---

#### 1-3. 섹션 5 — 신체검사 리포트 렌더링 개편
**데이터 출처**: `checkup_sections.section_type = 'physical'`  
**현재**: 그리드 형태로 소견 텍스트만 표시  
**개편 방향**:
- 활력징후 (체온/심박수/호흡수/혈압)를 수치 카드로 표시
- BCS/MCS → 시각적 게이지
- 각 계통 소견을 정상(emerald) / 이상(amber/red) 배지로 표시

---

#### 1-4. 섹션 7 — 계통별 평가 `OrganSection` 개편
**현재 구현**: lab + AI(DxEvaluation) + 이미지  
**추가 필요**: `physicalFindings` 렌더링  
**개편 방향**:
```
[계통 헤더] — 상태 배지 + 1줄 요약
  ├─ 신체검사 소견 (새로 추가)
  ├─ 임상병리 카드 그리드
  ├─ AI 종합 소견 (detail + action)
  └─ 관련 이미지
```

---

### 🟡 Phase 2 — 기능 확장

#### 2-1. 섹션 6 — BCS 칼로리 계산기 리포트 표시
- `calcCalories()` 함수 활용
- 리포트에 체중 관리 목표 카드 자동 생성 (현재체중, 이상체중, RER, DER)

#### 2-2. Executive Summary 1페이지
- 리포트 맨 앞 삽입
- 신호등 색상(🔴🟡🟢) + 계통별 한줄 요약
- 즉시 처치 필요 항목 강조

#### 2-3. 품종 소인 DB 캐싱
- `breed_risk_cache` 테이블 신규 생성
- 같은 품종 재방문 시 AI 재호출 없이 DB에서 로드
- 관리자가 편집·승인 가능한 구조

---

### 🟢 Phase 3 — 완성도 향상

#### 3-1. 인쇄 레이아웃 최적화
- A4 기준 페이지 분할 (`break-before-page`, `break-inside-avoid`)
- 섹션별 페이지 번호
- 병원 로고 헤더/푸터

#### 3-2. 부록 구조 분리
- 부록 A: 혈액검사 결과 전체 (이상값 하이라이트)
- 부록 B: 방사선 이미지 + 판독 소견
- 부록 C: 초음파 장기별 소견 + 이미지
- 부록 E: BCS 그림, 체중 관리 일지 양식

---

## 디자인 시스템 (섹션 공통)

| 요소 | 스타일 |
|------|--------|
| 섹션 제목 | `text-base font-bold text-slate-800` + 하단 teal 경계선 |
| 정상 소견 | `bg-emerald-50 border-emerald-200 text-emerald-800` |
| 경도 이상 | `bg-amber-50 border-amber-200 text-amber-800` |
| 중등도 이상 | `bg-orange-50 border-orange-200 text-orange-800` |
| 중증 이상 | `bg-red-50 border-red-200 text-red-800` |
| 수치 카드 | `rounded-lg border shadow-sm p-3`, 수치는 `font-mono text-lg` |
| 계통 헤더 | teal 배경 + 흰색 텍스트 + 상태 배지 |
| AI 소견 박스 | `bg-slate-50 rounded-lg p-4` + "종합 소견" 레이블 |
| 권장 조치 카드 | 상태에 따른 색상 (`amber/orange/red` 배경) |

---

## 파일 구조 현황

```
constants/hospital/checkup/
  ├── life-stage-ref.ts        ✅ 신규 생성 (사람나이 환산 + 생애단계 + 칼로리)
  ├── physical-ref.ts          ✅ 기존 완성 (10개 섹션 신체검사 항목)
  ├── lab-ref-cbc.ts           ✅ descriptionKo 완료 (13개)
  ├── lab-ref-chemistry.ts     ✅ descriptionKo 일부 (11개)
  ├── lab-ref-special.ts       ✅ descriptionKo 완료 (8개)
  └── lab-ref-urinalysis.ts    ⬜ descriptionKo 미추가

lib/
  ├── config/checkup-report-modules.ts   ✅ physicalIds 매핑 + PhysicalFinding 타입
  └── actions/checkup/
      ├── plan-analysis.ts               ✅ DxEvaluation 구조화
      └── inquiry-risk-analysis.ts       ✅ BreedRisk/AgeRisk/Management 구조화

components/hospital/checkup/
  ├── checkup-case/
  │   ├── tab1-inquiry.tsx     ✅ 구조화 AI 소견 입력
  │   ├── tab2-physical.tsx    ✅ 신체검사 입력 폼
  │   ├── tab3-lab.tsx         ✅ 임상병리 입력
  │   ├── tab4-imaging.tsx     ✅ ownerResultTextKo 연결
  │   └── tab5-plan.tsx        ✅ DxFieldBlock 구조화 편집
  └── checkup-report/
      └── checkup-report.tsx   🔄 개편 진행 중
```

---

## 다음 작업 순서

1. **리포트 헤더** — 생애단계 배지 + 사람나이 표시  
2. **섹션 1-2** — 문진 리포트 카드 레이아웃 개편  
3. **섹션 5** — 신체검사 수치 카드 + 계통 소견 배지  
4. **섹션 7** — `OrganSection`에 `physicalFindings` 렌더링 추가  
5. **섹션 6** — BCS 칼로리 카드 자동 생성  
6. **Executive Summary** — 1페이지 요약 신설
