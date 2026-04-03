'use server'

import { createClient } from '@/lib/supabase/server'
import { getEchoTest, getEchoTestsBySpecies, ITEMS_BY_SECTION } from '@/constants/hospital/echocardio/echo-tests'
import { DEFAULT_SECTION_ORDER } from '@/constants/hospital/echocardio/echo-sections'
import { calculate, getRangeIndex, getRangeIndexString } from '@/constants/hospital/echocardio/echo-calculators'
import { getDogMmodeRef, getCatMmodeRef } from '@/constants/hospital/echocardio/echo-mmode-ref'
import type {
  EchoResult,
  EchoTemplate,
  EchoSection,
  Species,
} from '@/types/echocardio/echocardio-type'

// =============================================
// 검사 결과값 자동 판정
// =============================================
function judgeResult(
  keywordId: string,
  value: string,
  allValues: Record<string, string>,
  species: Species = 'canine',
): { result: string; comment: string } {
  const test = getEchoTest(keywordId, species)
  if (!test) return { result: '', comment: '' }

  if (test.testType === 'select') {
    const idx = test.options.indexOf(value)
    if (idx < 0) return { result: '', comment: '' }
    return {
      result: test.optResult[idx] ?? '',
      comment: test.optComment[idx] ?? '',
    }
  }

  if (test.testType === 'range') {
    const num = parseFloat(value)
    if (isNaN(num)) return { result: '', comment: '' }
    const idx = getRangeIndex(num, test.thresholds)
    return {
      result: test.optResult[idx] ?? '',
      comment: test.optComment[idx] ?? '',
    }
  }

  if (test.testType === 'mmode_range' || test.testType === 'mmode_formula') {
    const num = parseFloat(value)
    const bw = parseFloat(allValues['BW_kg'] ?? '')
    if (isNaN(num) || isNaN(bw) || bw <= 0) return { result: '', comment: '' }

    let ref: [number, number] | null = null
    if (species === 'feline' && test.testType === 'mmode_formula') {
      ref = getCatMmodeRef(keywordId as any, bw)
    } else {
      ref = getDogMmodeRef(keywordId as any, bw)
    }

    if (!ref) return { result: '', comment: '' }
    const idx = getRangeIndex(num, [ref[0], ref[1]])
    return {
      result: test.optResult[idx] ?? '',
      comment: test.optComment[idx] ?? '',
    }
  }

  if (test.testType === 'calculated') {
    const num = parseFloat(value)
    if (isNaN(num)) return { result: '', comment: '' }
    const isEmptyThresholds = test.thresholds.length === 0
    if (isEmptyThresholds) return { result: value, comment: '' }

    const idx = getRangeIndex(num, test.thresholds)
    return {
      result: test.optResult[idx] ?? '',
      comment: test.optComment[idx] ?? '',
    }
  }

  if (test.testType === 'calculated_string') {
    if (value === '') return { result: '', comment: '' }
    const isEmptyThresholds =
      test.thresholds.length === 0 ||
      (test.thresholds.length === 1 && test.thresholds[0] === '')

    if (isEmptyThresholds) return { result: value, comment: '' }

    const idx = getRangeIndexString(value, test.thresholds as string[])
    return {
      result: test.optResult[idx] ?? '',
      comment: test.optComment[idx] ?? '',
    }
  }

  return { result: '', comment: '' }
}

// =============================================
// 단일 결과값 저장 (upsert)
// =============================================
export async function upsertEchoResult(params: {
  echoChartId: string
  keywordId: string
  value: string
  allValues: Record<string, string>
}): Promise<EchoResult> {
  const supabase = await createClient()

  const { result, comment } = judgeResult(
    params.keywordId,
    params.value,
    params.allValues,
    params.allValues['species'] as Species,
  )

  const { data, error } = await supabase
    .from('echo_results')
    .upsert(
      {
        echo_chart_id: params.echoChartId,
        keyword_id: params.keywordId,
        value: params.value,
        result,
        comment,
      },
      { onConflict: 'echo_chart_id,keyword_id' },
    )
    .select()
    .single()

  if (error) throw new Error(`upsertEchoResult: ${error.message}`)
  return data as unknown as EchoResult
}

export async function updateCalculatedResults(params: {
  echoChartId: string
  changedKeywordId: string
  allValues: Record<string, string>
}): Promise<void> {
  const supabase = await createClient()
  const visited = new Set<string>()
  const queue = [params.changedKeywordId]
  const currentValues = { ...params.allValues }
  const species = params.allValues['species'] as Species || 'canine'
  const ECHO_TESTS = getEchoTestsBySpecies(species)

  // 무한 루프 방지 및 연쇄 계산을 위한 큐 방식 처리
  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    // 현재 currentId를 의존성으로 가지는 항목들 찾기
    const dependents = Object.values(ECHO_TESTS as any).filter((test: any) => {
      const isCalc =
        test.testType === 'calculated' || test.testType === 'calculated_string'
      return isCalc && test.dependencies.includes(currentId)
    })

    if (dependents.length === 0) continue

    const upsertRows = []

    for (const testObj of dependents) {
      const test = testObj as any
      if (
        test.testType !== 'calculated' &&
        test.testType !== 'calculated_string'
      )
        continue

      // 계산에 필요한 모든 의존성 값 준비
      const depInputs = Object.fromEntries(
        (test.dependencies as string[]).map((dep) => [dep, currentValues[dep] ?? '']),
      )

      const calcValue = calculate(test.formula, depInputs)
      const valueStr = calcValue === null ? '' : String(calcValue)

      // 기존 값과 동일하면 더 이상 연쇄시키지 않음
      if (currentValues[test.keywordID] === valueStr) continue

      // 로컬 값 업데이트 (다음 단계를 위해)
      currentValues[test.keywordID] = valueStr

      const { result, comment } = judgeResult(
        test.keywordID,
        valueStr,
        currentValues,
        species,
      )

      upsertRows.push({
        echo_chart_id: params.echoChartId,
        keyword_id: test.keywordID,
        value: valueStr,
        result,
        comment,
      })

      // 이 항목이 업데이트되었으니, 얘를 의존하는 또 다른 애들도 계산해야 함
      queue.push(test.keywordID)
    }

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from('echo_results')
        .upsert(upsertRows, { onConflict: 'echo_chart_id,keyword_id' })

      if (error)
        throw new Error(
          `updateCalculatedResults recursive error: ${error.message}`,
        )
    }
  }
}

// =============================================
// 차트 메모 업데이트
// =============================================
export async function updateEchoMemo(
  echoId: string,
  memo: string,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('echo_charts')
    .update({ memo })
    .eq('id', echoId)
  if (error) throw new Error(`updateEchoMemo: ${error.message}`)
}

// =============================================
// 담당의 / 검사자 업데이트
// =============================================
export async function updateEchoVets(
  echoId: string,
  vetId: string | null,
  examinerId: string | null,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('echo_charts')
    .update({ vet_id: vetId, examiner_id: examinerId })
    .eq('id', echoId)
  if (error) throw new Error(`updateEchoVets: ${error.message}`)
}

// =============================================
// 템플릿 설정 업데이트
// =============================================
export async function upsertEchoTemplate(
  templateId: string,
  updates: {
    name?: string
    description?: string | null
    section_order?: EchoSection[]
    item_order?: Record<string, string[]>
    active_items?: Record<string, string[]>
    target_species?: Species
  },
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('echo_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', templateId)
  if (error) throw new Error(`upsertEchoTemplate: ${error.message}`)
}

// 하위 호환: hosId 기반으로 활성 템플릿 업데이트
export async function upsertEchoSettings(
  hosId: string,
  settings: {
    section_order?: EchoSection[]
    item_order?: Record<string, string[]>
    active_items?: Record<string, string[]>
  },
): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('echo_templates')
    .select('id')
    .eq('hos_id', hosId)
    .eq('is_default', true)
    .single()
  if (!data) return
  await upsertEchoTemplate(data.id, settings)
}

// =============================================
// 새 템플릿 생성
// =============================================
export async function insertEchoTemplate(
  hosId: string,
  name: string,
  targetSpecies: Species,
  description?: string,
): Promise<EchoTemplate> {
  const supabase = await createClient()

  // 현재 활성 템플릿의 설정을 복사해서 새 템플릿 생성
  const { data: activeTemplate } = await supabase
    .from('echo_templates')
    .select('section_order, item_order, active_items')
    .eq('hos_id', hosId)
    .eq('target_species', targetSpecies)
    .eq('is_default', true)
    .single()

  // 병원에 템플릿이 하나도 없으면 첫 번째 템플릿을 기본값으로 설정
  const { count } = await supabase
    .from('echo_templates')
    .select('id', { count: 'exact', head: true })
    .eq('hos_id', hosId)

  const isFirst = (count ?? 0) === 0

  const defaultActiveItems: Record<string, string[]> = Object.fromEntries(
    Object.entries(ITEMS_BY_SECTION as any).map(([section, items]) => [
      section,
      (items as any[]).map((i) => i.keywordID),
    ]),
  )

  const { data, error } = await supabase
    .from('echo_templates')
    .insert({
      hos_id: hosId,
      name,
      target_species: targetSpecies,
      description: description ?? null,
      section_order: activeTemplate?.section_order ?? DEFAULT_SECTION_ORDER,
      item_order: activeTemplate?.item_order ?? {},
      active_items: activeTemplate?.active_items ?? defaultActiveItems,
      is_default: isFirst,
      display_order: 0,
    })
    .select()
    .single()

  if (error) throw new Error(`insertEchoTemplate: ${error.message}`)
  return data as unknown as EchoTemplate
}

// =============================================
// 기본 템플릿 변경
// =============================================
export async function setDefaultTemplate(
  hosId: string,
  templateId: string,
): Promise<void> {
  const supabase = await createClient()

  // 기존 default 해제
  await supabase
    .from('echo_templates')
    .update({ is_default: false })
    .eq('hos_id', hosId)
    .eq('is_default', true)

  // 새 default 설정
  const { error } = await supabase
    .from('echo_templates')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', templateId)

  if (error) throw new Error(`setDefaultTemplate: ${error.message}`)
}

// =============================================
// 템플릿 삭제
// =============================================
export async function deleteEchoTemplate(templateId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('echo_templates')
    .delete()
    .eq('id', templateId)
  if (error) throw new Error(`deleteEchoTemplate: ${error.message}`)
}
