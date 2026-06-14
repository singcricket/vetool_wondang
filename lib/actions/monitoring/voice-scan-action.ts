'use server'

import { getAnthropicClient } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import type { VitalEntry, MsMemo } from '@/types/monitoring/monitoring-type'
import { VITAL_REFERENCE_DATA } from '@/types/monitoring/monitoring-type'

const VITAL_NAMES = VITAL_REFERENCE_DATA.map((v) => v.vitalName)

export async function extractVitalsFromSpeech(params: {
  transcript: string
  species: 'canine' | 'feline' | null
  sessionTitle: string | null
}): Promise<{ data: { vitals: VitalEntry[]; memo: string | null } | null; error: string | null }> {
  const { transcript, species, sessionTitle } = params
  const sp = species ?? 'canine'

  try {
    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `동물병원 모니터링 프로그램의 음성 입력입니다. 수의학 전문 용어, 약물명, 처치 용어가 자주 등장합니다.
${sessionTitle ? `세션: ${sessionTitle}` : ''}
환자 종: ${sp === 'feline' ? '고양이(Feline)' : '개(Canine)'}

음성 인식 원본 텍스트 (STT 오류 포함 가능):
"${transcript}"

=== STEP 1: 텍스트 교정 ===
음성 인식 오류를 수의학/의료 맥락으로 교정하세요.
- 발음 유사 오류: "안삐실린" → "암피실린", "아목시" → "아목시실린", "케타민" → "케타민"
- 약물명: 암피실린, 아목시실린, 세파졸린, 케타민, 프로포폴, 아트로핀, 에피네프린, 도파민, 도부타민, 푸로세마이드, 메트로니다졸, 마르보플록사신, 엔로플록사신, 메로페넴 등
- 처치 용어: 수혈, 수액, 마취, 삽관, 발관, 카테터, 봉합, 절개, 지혈 등
- 수치+단위가 붙은 경우 그대로 유지 (교정만, 분리는 STEP 2에서)
- 명백한 오류가 없으면 원본 그대로 사용

=== STEP 2: 수치 추출 ===
교정된 텍스트에서 측정 수치를 추출하세요.

구어체 항목명 매핑:
- 심박수, 맥박, HR → 심박수(HR)
- 체온, 온도, 열 → 체온(°C)
- 호흡수, 호흡, RR → 호흡수(RR)
- 혈압, BP, 수축기 → 혈압(BP)
- 산소포화도, 산소, SpO2 → SPO2
- 혈당, 당 → 혈당
- EtCO2, 이산화탄소 → EtCO2
- 평균동맥압, MAP → MAP(평균동맥압)
- 젖산, 락테이트 → 젖산(Lactate)
- 점막 → MMC | 피부탄력 → Skin Turgor | CRT → CRT
- 의식, 정신 → Mental | 동공 → PLR
- 통증 → 통증점수(NRS) | MAC → MAC
- 소변, 배뇨 → 배뇨량 | 수액량 → 수액량 | 체중 → 체중

추출 규칙:
- 항목명+숫자 붙어 있어도 분리 (예: "체온36도" → value: "36")
- 단위 제거, 숫자만 (예: "38.5도" → "38.5")
- 모든 수치 빠짐없이 추출
- 수치가 아닌 처치/상황/투약/관찰 내용은 교정된 원문 그대로 memo로 반환 (요약하거나 바꾸지 말 것)
- memo는 수치 부분을 제외한 나머지 문장 전체 (예: "암피실린 추가했습니다", "배뇨 확인됨", "보호자 통화 완료")
- 수치만 말했고 처치/상황 설명이 전혀 없으면 memo=null
- 수치 없으면 vitals=[]

사용 가능한 항목명: ${VITAL_NAMES.join(', ')}

예시1:
입력: "안삐실린 추가했습니다 심박수 120 체온36도"
출력: {"corrected_transcript":"암피실린 추가했습니다 심박수 120 체온36도","vitals":[{"vitalName":"심박수(HR)","value":"120"},{"vitalName":"체온(°C)","value":"36"}],"memo":"암피실린 추가했습니다"}

예시2:
입력: "심박수 130 배뇨 확인됐고 수액 속도 늘렸습니다"
출력: {"corrected_transcript":"심박수 130 배뇨 확인됐고 수액 속도 늘렸습니다","vitals":[{"vitalName":"심박수(HR)","value":"130"}],"memo":"배뇨 확인됐고 수액 속도 늘렸습니다"}

예시3:
입력: "심박수 120 산소포화도 98"
출력: {"corrected_transcript":"심박수 120 산소포화도 98","vitals":[{"vitalName":"심박수(HR)","value":"120"},{"vitalName":"SPO2","value":"98"}],"memo":null}

JSON만 반환:`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const stripped = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(stripped) as { corrected_transcript: string; vitals: VitalEntry[]; memo: string | null }
    return { data: parsed, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { data: null, error: `음성 분석 실패: ${msg}` }
  }
}

export async function appendVoiceMemoToSession(
  sessionId: string,
  memoText: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data, error: fetchError } = await supabase
    .from('monitoring_sessions')
    .select('memo_tx')
    .eq('session_id', sessionId)
    .single()

  if (fetchError) return { error: fetchError.message }

  const now = new Date().toISOString()
  const newMemo: MsMemo = {
    id: `${now}-${Math.random().toString(36).substring(2, 9)}`,
    memo: memoText,
    check: '',
    create_timestamp: now,
    color: '#fef9c3',
    is_done: true,
    is_realtime_memo: true,
    done_timestamp: now,
    chosen: false,
    has_imgs: false,
    img_url: [],
  }

  const current: MsMemo[] = (data?.memo_tx as MsMemo[]) ?? []
  const { error: updateError } = await supabase
    .from('monitoring_sessions')
    .update({ memo_tx: [...current, newMemo] })
    .eq('session_id', sessionId)

  return { error: updateError?.message ?? null }
}
