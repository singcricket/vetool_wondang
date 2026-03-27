'use server'

import { createClient } from '@/lib/supabase/server'
import { ECHO_TESTS } from '@/constants/hospital/echocardio/echo-tests'
import { calculate, getRangeIndex } from '@/constants/hospital/echocardio/echo-calculators'
import { judgeMmodeValue } from '@/constants/hospital/echocardio/mmode-ref-dog'
import type {
  EchoResult,
  EchoSettings,
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
// 병원 설정 저장 (upsert)
// =============================================
export async function upsertEchoSettings(
  hosId: string,
  settings: {
    section_order?: EchoSection[]
    item_order?: Record<string, string[]>
    active_items?: Record<string, string[]>
  },
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('echo_settings').upsert(
    {
      hos_id: hosId,
      ...settings,
    },
    { onConflict: 'hos_id' },
  )

  if (error) throw new Error(`upsertEchoSettings: ${error.message}`)
}
