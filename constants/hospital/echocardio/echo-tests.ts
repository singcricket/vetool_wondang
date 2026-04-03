import type {
  EchoTest,
  EchoTestUIMeta,
  Species,
} from '@/types/echocardio/echocardio-type'
import { ECHO_TESTS_CANINE } from './echo-tests-canine'
import { ECHO_TESTS_FELINE } from './echo-tests-feline'

export { ECHO_TESTS_CANINE, ECHO_TESTS_FELINE }

/**
 * 종(species)에 맞는 전체 테스트 항목 반환
 */
export function getEchoTestsBySpecies(species: Species): Record<string, EchoTest> {
  if (species === 'feline') return ECHO_TESTS_FELINE
  return ECHO_TESTS_CANINE
}

/**
 * 특정 키워드에 대해 종별 테스트 정의 반환
 */
export function getEchoTest(
  keywordId: string,
  species: Species = 'canine',
): EchoTest | undefined {
  const tests = getEchoTestsBySpecies(species)
  return tests[keywordId]
}

/**
 * 모든 항목 합집합 (검색/매핑용)
 * 종별 정보(species, sections, groups)를 유실 없이 병합
 */
function mergeTests(): Record<string, EchoTest> {
  const merged: Record<string, EchoTest> = { ...ECHO_TESTS_CANINE }
  
  Object.values(ECHO_TESTS_FELINE).forEach((fTest) => {
    const cTest = merged[fTest.keywordID]
    if (cTest) {
      merged[fTest.keywordID] = {
        ...cTest,
        ...fTest,
        species: Array.from(new Set([...cTest.species, ...fTest.species])),
        sections: Array.from(new Set([...(cTest.sections || []), ...(fTest.sections || [])])),
        groups: Array.from(new Set([...(cTest.groups || []), ...(fTest.groups || [])])),
      }
    } else {
      merged[fTest.keywordID] = fTest
    }
  })
  
  return merged
}

export const ECHO_TESTS_ALL: Record<string, EchoTest> = mergeTests()

/**
 * 구형 코드 호환성용 (기본값 개 기준)
 */
export const ECHO_TESTS = ECHO_TESTS_CANINE

/**
 * UI 전달용 경량 메타데이터 생성
 */
export function getEchoTestUIMeta(species: Species): EchoTestUIMeta[] {
  const tests = getEchoTestsBySpecies(species)
  return Object.values(tests).map((t) => ({
    keywordID: t.keywordID,
    keywordName: t.keywordName,
    species: t.species,
    testType: t.testType,
    unit: 'unit' in t ? t.unit : undefined,
    options: t.testType === 'select' ? t.options : undefined,
    sections: t.sections,
    groups: t.groups,
    testref: t.testref,
    testinfo: t.testinfo,
    anatomic_groups: t.anatomic_groups,
    functional_groups: t.functional_groups,
    // 계산 공식 정보 추가
    formula: 'formula' in t ? (t as any).formula : undefined,
    dependencies: 'dependencies' in t ? (t as any).dependencies : undefined,
  }))
}

/**
 * 모든 종의 테스트를 합쳐서 UI 메타데이터 생성 (종별 필터링은 클라이언트에서 수행)
 */
export function getAllEchoTestUIMeta(): EchoTestUIMeta[] {
  return Object.values(ECHO_TESTS_ALL).map((t) => ({
    keywordID: t.keywordID,
    keywordName: t.keywordName,
    species: t.species,
    testType: t.testType,
    unit: 'unit' in t ? t.unit : undefined,
    options: t.testType === 'select' ? t.options : undefined,
    sections: t.sections,
    groups: t.groups,
    testref: t.testref,
    testinfo: t.testinfo,
    anatomic_groups: t.anatomic_groups,
    functional_groups: t.functional_groups,
    // 계산 공식 정보 추가
    formula: 'formula' in t ? (t as any).formula : undefined,
    dependencies: 'dependencies' in t ? (t as any).dependencies : undefined,
  }))
}

/**
 * 섹션별 항목 그룹화 (하위 호환 및 템플릿 초기화용)
 */
export const ITEMS_BY_SECTION: Record<string, EchoTest[]> = {}
Object.values(ECHO_TESTS_ALL).forEach((test) => {
  test.sections?.forEach((section) => {
    if (!ITEMS_BY_SECTION[section]) {
      ITEMS_BY_SECTION[section] = []
    }
    // 중복 방지 (여러 종에 걸쳐 있는 항목)
    if (!ITEMS_BY_SECTION[section].some((t) => t.keywordID === test.keywordID)) {
      ITEMS_BY_SECTION[section].push(test)
    }
  })
})
