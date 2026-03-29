'use server'

import { createClient } from '@/lib/supabase/server'
import { ECHO_TESTS, ITEMS_BY_SECTION } from '@/constants/hospital/echocardio/echo-tests'
import { DEFAULT_SECTION_ORDER } from '@/constants/hospital/echocardio/echo-sections'
import { calculate, getRangeIndex } from '@/constants/hospital/echocardio/echo-calculators'
import { judgeMmodeValue } from '@/constants/hospital/echocardio/mmode-ref-dog'
import type {
  EchoResult,
  EchoTemplate,
  EchoSection,
} from '@/types/echocardio/echocardio-type'

// =============================================
// 검사 결과값 자동 판정
// =============================================
function judgeResult(
  keywordId: string,
  value: string,
  allValues: Record<string, string>,
): { result: string; comment: string } {
  const test = ECHO_TESTS[keywordId]
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

  if (test.testType === 'mmode_range') {
    const num = parseFloat(value)
    const bw = parseFloat(allValues['BW_kg'] ?? '')
    if (isNaN(num) || isNaN(bw)) return { result: '', comment: '' }
    const judgment = judgeMmodeValue(num, bw, keywordId)
    if (!judgment) return { result: '', comment: '' }
    const idx = ['decrease', 'normal', 'increase'].indexOf(judgment)
    return {
      result: test.optResult[idx] ?? '',
      comment: test.optComment[idx] ?? '',
    }
  }

  if (test.testType === 'calculated') {
    const num = parseFloat(value)
    if (isNaN(num) || test.thresholds.length === 0)
      return { result: '', comment: '' }
    const idx = getRangeIndex(num, test.thresholds)
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

// =============================================
// 계산 항목 자동 업데이트
// 의존 필드 값이 변경될 때 호출
// =============================================
export async function updateCalculatedResults(params: {
  echoChartId: string
  changedKeywordId: string
  allValues: Record<string, string>
}): Promise<void> {
  const supabase = await createClient()

  // 변경된 keywordId를 dependency로 갖는 calculated 항목 찾기
  const dependents = Object.values(ECHO_TESTS).filter(
    (test) =>
      test.testType === 'calculated' &&
      test.dependencies.includes(params.changedKeywordId),
  )

  if (dependents.length === 0) return

  const upsertRows = dependents
    .map((test) => {
      if (test.testType !== 'calculated') return null

      const depInputs = Object.fromEntries(
        test.dependencies.map((dep) => [dep, params.allValues[dep] ?? '']),
      )
      const calcValue = calculate(test.formula, depInputs)
      if (calcValue === null) return null

      const valueStr = String(calcValue)
      const { result, comment } = judgeResult(
        test.keywordID,
        valueStr,
        params.allValues,
      )

      return {
        echo_chart_id: params.echoChartId,
        keyword_id: test.keywordID,
        value: valueStr,
        result,
        comment,
      }
    })
    .filter(Boolean)

  if (upsertRows.length === 0) return

  const { error } = await supabase
    .from('echo_results')
    .upsert(upsertRows as any[], { onConflict: 'echo_chart_id,keyword_id' })

  if (error) throw new Error(`updateCalculatedResults: ${error.message}`)
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
  description?: string,
): Promise<EchoTemplate> {
  const supabase = await createClient()

  // 현재 활성 템플릿의 설정을 복사해서 새 템플릿 생성
  const { data: activeTemplate } = await supabase
    .from('echo_templates')
    .select('section_order, item_order, active_items')
    .eq('hos_id', hosId)
    .eq('is_default', true)
    .single()

  // 병원에 템플릿이 하나도 없으면 첫 번째 템플릿을 기본값으로 설정
  const { count } = await supabase
    .from('echo_templates')
    .select('id', { count: 'exact', head: true })
    .eq('hos_id', hosId)

  const isFirst = (count ?? 0) === 0

  const defaultActiveItems = Object.fromEntries(
    Object.entries(ITEMS_BY_SECTION).map(([section, items]) => [
      section,
      items.map((i) => i.keywordID),
    ]),
  )

  const { data, error } = await supabase
    .from('echo_templates')
    .insert({
      hos_id: hosId,
      name,
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
