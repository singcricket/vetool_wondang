'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, LoaderCircle, CheckCircle2, Trash2, RotateCcw, NotebookPen, ClipboardCheck } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { extractVitalsFromSpeech, appendVoiceMemoToSession, markPlanStepsDone } from '@/lib/actions/monitoring/voice-scan-action'
import type { TreatmentStepHint } from '@/lib/actions/monitoring/voice-scan-action'
import type { VitalEntry, VitalTimeSlot } from '@/types/monitoring/monitoring-type'

interface Props {
  sessionId: string
  species: 'canine' | 'feline' | null
  sessionTitle: string | null
  startTime: string | null
  intervalSetting: number | null
  treatmentMemos: TreatmentStepHint[]
  onInsertRow: (slot: VitalTimeSlot) => void
}

function calcMinTime(nowMs: number, startTime: string | null, intervalSetting: number | null): string {
  if (!startTime) return '0'
  const elapsedMin = Math.floor((nowMs - new Date(startTime).getTime()) / 60000)
  const clamped = Math.max(0, elapsedMin)
  if (!intervalSetting || intervalSetting <= 1) return String(clamped)
  return String(Math.floor(clamped / intervalSetting) * intervalSetting)
}

type MatchedStep = TreatmentStepHint & { selected: boolean }

export default function VoiceInputDialog({ sessionId, species, sessionTitle, startTime, intervalSetting, treatmentMemos, onInsertRow }: Props) {
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [vitals, setVitals] = useState<VitalEntry[] | null>(null)
  const [memo, setMemo] = useState<string | null>(null)
  const [correctedTranscript, setCorrectedTranscript] = useState<string | null>(null)
  const [savingMemo, setSavingMemo] = useState(false)
  const [matchedSteps, setMatchedSteps] = useState<MatchedStep[] | null>(null)
  const [markingDone, setMarkingDone] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const transcriptRef = useRef('')      // 세션 간 누적 텍스트
  const sessionFinalRef = useRef('')    // 현재 세션의 확정 텍스트
  const holdStartRef = useRef(0)        // 버튼 누른 시각
  const isHoldingRef = useRef(false)

  const analyzeAndShow = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast.error('인식된 내용이 없습니다. 다시 시도해보세요.')
      return
    }
    setAnalyzing(true)
    try {
      const { data, error } = await extractVitalsFromSpeech({
        transcript: text.trim(),
        species,
        sessionTitle,
        treatmentSteps: treatmentMemos.length > 0 ? treatmentMemos : null,
      })
      if (error || !data) { toast.error(error ?? '분석 실패'); return }
      setVitals(data.vitals)
      setMemo(data.memo)
      setCorrectedTranscript(data.corrected_transcript ?? null)
      if (data.matched_plan_ids.length > 0) {
        const matched = treatmentMemos
          .filter((m) => data.matched_plan_ids.includes(m.id))
          .map((m) => ({ ...m, selected: true }))
        setMatchedSteps(matched.length > 0 ? matched : null)
      } else {
        setMatchedSteps(null)
      }
      setHasAnalyzed(true)
    } catch {
      toast.error('분석 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }, [species, sessionTitle, treatmentMemos])

  const launchSession = useCallback((SpeechRecognitionClass: typeof SpeechRecognition) => {
    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'ko-KR'
    recognition.continuous = false   // 단발 세션 — 버퍼 재처리 없음
    recognition.interimResults = true
    recognitionRef.current = recognition
    sessionFinalRef.current = ''

    recognition.onresult = (event) => {
      let finalInSession = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalInSession += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      sessionFinalRef.current = finalInSession
      setFinalText(transcriptRef.current + finalInSession)
      setInterimText(interim)
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return
      // no-speech는 조용히 재시작 (버튼 누르는 중)
      if (event.error === 'no-speech') return
      toast.error(`음성 인식 오류: ${event.error}`)
    }

    recognition.onend = () => {
      // 이 세션의 최종 텍스트를 누적
      transcriptRef.current += sessionFinalRef.current
      sessionFinalRef.current = ''

      if (isHoldingRef.current) {
        // 아직 버튼을 누르고 있음 → 새 세션으로 이어서 녹음
        launchSession(SpeechRecognitionClass)
      } else {
        // 버튼 뗌 → 분석
        recognitionRef.current = null
        const elapsed = Date.now() - holdStartRef.current
        if (elapsed < 800) return
        analyzeAndShow(transcriptRef.current)
      }
    }

    recognition.start()
  }, [analyzeAndShow])

  const startRecording = useCallback(() => {
    const SpeechRecognitionClass =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      toast.error('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.')
      return
    }

    transcriptRef.current = ''
    sessionFinalRef.current = ''
    setFinalText('')
    setInterimText('')
    setVitals(null)
    setMemo(null)
    setCorrectedTranscript(null)
    isHoldingRef.current = true
    holdStartRef.current = Date.now()

    launchSession(SpeechRecognitionClass)
    setRecording(true)
  }, [launchSession])

  const stopRecording = useCallback(() => {
    if (!isHoldingRef.current) return
    isHoldingRef.current = false
    setRecording(false)
    setInterimText('')

    const recognition = recognitionRef.current
    if (recognition) {
      recognition.stop()  // onend에서 분석 시작
    } else {
      // 세션 재시작 사이 틈에 뗀 경우 직접 분석
      analyzeAndShow(transcriptRef.current)
    }
  }, [analyzeAndShow])

  const updateVital = (idx: number, value: string) => {
    if (!vitals) return
    setVitals(vitals.map((v, i) => (i === idx ? { ...v, value } : v)))
  }

  const removeVital = (idx: number) => {
    if (!vitals) return
    setVitals(vitals.filter((_, i) => i !== idx))
  }

  const handleAddToChecklist = () => {
    const entries = (vitals ?? []).filter((v) => v.value.trim())
    if (entries.length === 0) { toast.error('입력할 수치가 없습니다.'); return }
    const now = Date.now()
    onInsertRow({ create_timestamp: String(now), minTime: calcMinTime(now, startTime, intervalSetting), vitals: entries })
    toast.success(`${entries.length}개 항목이 체크리스트에 추가되었습니다.`)
    setVitals(null)
  }

  const handleSaveMemo = async () => {
    if (!memo?.trim()) return
    setSavingMemo(true)
    const { error } = await appendVoiceMemoToSession(sessionId, memo.trim())
    setSavingMemo(false)
    if (error) { toast.error('실시간 기록 저장 실패'); return }
    toast.success('실시간 기록에 저장되었습니다.')
    setMemo(null)
  }

  const handleSaveAll = async () => {
    const entries = (vitals ?? []).filter((v) => v.value.trim())
    const hasMemo = !!memo?.trim()
    if (!entries.length && !hasMemo) { handleClose(); return }

    if (entries.length) {
      const now = Date.now()
      onInsertRow({ create_timestamp: String(now), minTime: calcMinTime(now, startTime, intervalSetting), vitals: entries })
    }
    if (hasMemo) {
      setSavingMemo(true)
      const { error } = await appendVoiceMemoToSession(sessionId, memo!.trim())
      setSavingMemo(false)
      if (error) { toast.error('실시간 기록 저장 실패'); return }
    }
    if (entries.length && hasMemo) toast.success('체크리스트와 실시간 기록에 모두 저장되었습니다.')
    else if (entries.length) toast.success(`${entries.length}개 항목이 체크리스트에 추가되었습니다.`)
    else toast.success('실시간 기록에 저장되었습니다.')
    handleClose()
  }

  const handleMarkStepsDone = async () => {
    const toMark = (matchedSteps ?? []).filter((s) => s.selected).map((s) => s.id)
    if (toMark.length === 0) return
    setMarkingDone(true)
    const { error } = await markPlanStepsDone(sessionId, toMark)
    setMarkingDone(false)
    if (error) { toast.error('처치 완료 처리 실패'); return }
    toast.success(`${toMark.length}개 처치 항목이 완료 처리되었습니다.`)
    setMatchedSteps(null)
  }

  const handleReset = () => {
    setVitals(null)
    setMemo(null)
    setHasAnalyzed(false)
    setCorrectedTranscript(null)
    setFinalText('')
    setInterimText('')
    setMatchedSteps(null)
    transcriptRef.current = ''
    sessionFinalRef.current = ''
  }

  const handleClose = () => {
    isHoldingRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setOpen(false)
    setRecording(false)
    setAnalyzing(false)
    handleReset()
  }

  const hasResult = hasAnalyzed

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="h-10 gap-2 bg-violet-500 hover:bg-violet-600 text-white font-semibold px-4">
          <Mic size={16} />
          음성 입력
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic size={16} />
            음성으로 수치 입력
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 pt-2">

          {/* ── 녹음 화면 ── */}
          {!hasResult && !analyzing && (
            <>
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                버튼을 누르고 있는 동안 말하세요<br />
                <span className="text-slate-400">예: "심박수 120, 산소포화도 98, 체온 38.5"</span>
              </p>

              {/* 큰 마이크 버튼 */}
              <button
                type="button"
                className={[
                  'relative flex items-center justify-center rounded-full transition-all duration-150 select-none touch-none outline-none',
                  recording
                    ? 'w-32 h-32 bg-red-500 scale-105 shadow-[0_0_0_16px_rgba(239,68,68,0.12)]'
                    : 'w-32 h-32 bg-teal-500 hover:bg-teal-600 active:scale-95 shadow-xl',
                ].join(' ')}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startRecording() }}
                onPointerUp={stopRecording}
                onPointerLeave={() => { if (recording) stopRecording() }}
                onPointerCancel={() => { if (recording) stopRecording() }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {recording
                  ? <MicOff size={48} className="text-white" />
                  : <Mic size={48} className="text-white" />
                }
                {recording && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500" />
                  </span>
                )}
              </button>

              <p className={[
                'text-sm font-medium transition-colors',
                recording ? 'text-red-500 animate-pulse' : 'text-slate-400',
              ].join(' ')}>
                {recording ? '녹음 중... 손을 떼면 분석합니다' : '버튼을 길게 누르세요'}
              </p>

              {/* 실시간 텍스트 미리보기 */}
              {(finalText || interimText) && (
                <div className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-700 min-h-[52px] leading-relaxed">
                  {finalText}
                  <span className="text-slate-400">{interimText}</span>
                </div>
              )}
            </>
          )}

          {/* ── 분석 중 ── */}
          {analyzing && (
            <div className="flex flex-col items-center gap-3 py-8">
              <LoaderCircle size={36} className="animate-spin text-teal-500" />
              <p className="text-sm text-slate-500">수치 추출 중...</p>
              {finalText && (
                <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
                  &ldquo;{finalText.trim()}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* ── 결과 ── */}
          {hasResult && !analyzing && (
            <div className="w-full flex flex-col gap-4">
              {/* 인식/교정 텍스트 */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-500 leading-relaxed flex flex-col gap-1">
                {correctedTranscript && correctedTranscript !== finalText.trim() ? (
                  <>
                    <p><span className="text-slate-400">원본: </span><span className="line-through text-slate-400">{finalText.trim()}</span></p>
                    <p><span className="font-medium text-slate-600">교정: </span>{correctedTranscript}</p>
                  </>
                ) : (
                  <p><span className="font-medium text-slate-600">인식: </span>{finalText.trim()}</p>
                )}
              </div>

              {/* 체크리스트 수치 섹션 */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500">체크리스트 수치</p>
                {vitals && vitals.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-1">
                      {vitals.map((v, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_80px_28px] gap-1 items-center rounded px-2 py-1.5 bg-slate-50 border border-slate-100 text-xs">
                          <span className="text-slate-600 truncate">{v.vitalName}</span>
                          <Input
                            className="h-6 text-xs px-1 text-right"
                            value={v.value}
                            onChange={(e) => updateVital(idx, e.target.value)}
                          />
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-300 hover:text-red-400" onClick={() => removeVital(idx)}>
                            <Trash2 size={11} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs self-end"
                      onClick={handleAddToChecklist}
                    >
                      <CheckCircle2 size={13} />
                      체크리스트에 추가
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-1">수치가 인식되지 않았습니다.</p>
                )}
              </div>

              {/* 실시간 기록 섹션 */}
              {memo !== null && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500">실시간 기록</p>
                  <Textarea
                    className="text-xs min-h-[64px] resize-none border-yellow-200 bg-yellow-50 text-yellow-900 placeholder:text-yellow-400 focus-visible:ring-yellow-300"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="내용을 입력하세요"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs self-end border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    onClick={handleSaveMemo}
                    disabled={savingMemo || !memo?.trim()}
                  >
                    {savingMemo ? <LoaderCircle size={13} className="animate-spin" /> : <NotebookPen size={13} />}
                    실시간 기록에 저장
                  </Button>
                </div>
              )}

              {/* 처치계획 완료 확인 섹션 */}
              {matchedSteps && matchedSteps.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <ClipboardCheck size={13} className="text-teal-600" />
                    <p className="text-xs font-semibold text-teal-700">처치계획 완료 확인</p>
                  </div>
                  <p className="text-[11px] text-teal-600">음성에서 완료된 것으로 인식된 처치 항목입니다. 완료 처리할 항목을 선택하세요.</p>
                  <div className="flex flex-col gap-1.5">
                    {matchedSteps.map((step, idx) => (
                      <label key={step.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 bg-white border border-teal-100 hover:bg-teal-50/50 transition-colors">
                        <Checkbox
                          checked={step.selected}
                          onCheckedChange={(checked) => {
                            setMatchedSteps((prev) =>
                              prev ? prev.map((s, i) => i === idx ? { ...s, selected: !!checked } : s) : prev
                            )
                          }}
                          className="h-3.5 w-3.5 shrink-0 border-teal-400"
                        />
                        <span className="text-xs text-slate-700 leading-snug">{step.memo}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs self-end bg-teal-500 hover:bg-teal-600 text-white"
                    onClick={handleMarkStepsDone}
                    disabled={markingDone || matchedSteps.every((s) => !s.selected)}
                  >
                    {markingDone ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    완료 처리
                  </Button>
                </div>
              )}

              {/* 하단 버튼 */}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={handleReset}>
                  <RotateCcw size={12} />
                  다시입력
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleReset}>
                  취소
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-teal-500 hover:bg-teal-600 text-white"
                  onClick={handleSaveAll}
                  disabled={savingMemo}
                >
                  {savingMemo ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  모두저장
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
