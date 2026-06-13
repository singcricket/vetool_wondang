'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic, MicOff, LoaderCircle, CheckCircle2, Trash2, RotateCcw, NotebookPen } from 'lucide-react'
import { toast } from 'sonner'
import { extractVitalsFromSpeech, appendVoiceMemoToSession } from '@/lib/actions/monitoring/voice-scan-action'
import type { VitalEntry, VitalTimeSlot } from '@/types/monitoring/monitoring-type'

interface Props {
  sessionId: string
  species: 'canine' | 'feline' | null
  sessionTitle: string | null
  onInsertRow: (slot: VitalTimeSlot) => void
}

export default function VoiceInputDialog({ sessionId, species, sessionTitle, onInsertRow }: Props) {
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [vitals, setVitals] = useState<VitalEntry[] | null>(null)
  const [memo, setMemo] = useState<string | null>(null)
  const [correctedTranscript, setCorrectedTranscript] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const transcriptRef = useRef('')
  const startTimeRef = useRef(0)
  const isHoldingRef = useRef(false)

  const startRecording = useCallback(() => {
    const SpeechRecognitionClass =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      toast.error('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.')
      return
    }

    transcriptRef.current = ''
    setFinalText('')
    setInterimText('')
    setVitals(null)
    setMemo(null)
    isHoldingRef.current = true
    startTimeRef.current = Date.now()

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptRef.current += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setFinalText(transcriptRef.current)
      setInterimText(interim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        toast.error(`음성 인식 오류: ${event.error}`)
        setRecording(false)
        isHoldingRef.current = false
      }
    }

    // continuous=true여도 모바일에서 무음 시 자동 종료됨 → 홀딩 중이면 재시작
    recognition.onend = () => {
      if (isHoldingRef.current) {
        try { recognition.start() } catch { /* ignore */ }
      }
      // stopRecording 호출 시 onend를 덮어쓰므로 이 분기는 재시작 전용
    }

    recognition.start()
    setRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    if (!isHoldingRef.current) return
    isHoldingRef.current = false
    setRecording(false)
    setInterimText('')

    const recognition = recognitionRef.current
    if (!recognition) return

    const elapsed = Date.now() - startTimeRef.current

    // onend는 마지막 onresult가 끝난 뒤 호출되므로 여기서 분석 시작
    recognition.onend = async () => {
      recognitionRef.current = null

      if (elapsed < 800) return

      const text = transcriptRef.current.trim()
      if (!text) {
        toast.error('인식된 내용이 없습니다. 다시 시도해보세요.')
        return
      }

      setAnalyzing(true)
      try {
        const { data, error } = await extractVitalsFromSpeech({ transcript: text, species, sessionTitle })
        if (error || !data) {
          toast.error(error ?? '분석 실패')
          return
        }
        setVitals(data.vitals)
        setMemo(data.memo)
        setCorrectedTranscript(data.corrected_transcript ?? null)
      } catch {
        toast.error('분석 중 오류가 발생했습니다.')
      } finally {
        setAnalyzing(false)
      }
    }

    recognition.stop()
  }, [species, sessionTitle])

  const updateVital = (idx: number, value: string) => {
    if (!vitals) return
    setVitals(vitals.map((v, i) => (i === idx ? { ...v, value } : v)))
  }

  const removeVital = (idx: number) => {
    if (!vitals) return
    setVitals(vitals.filter((_, i) => i !== idx))
  }

  const handleConfirm = () => {
    const entries = (vitals ?? []).filter((v) => v.value.trim())
    if (entries.length === 0) {
      toast.error('입력할 수치가 없습니다.')
      return
    }
    const now = Date.now()
    const slot: VitalTimeSlot = {
      create_timestamp: String(now),
      minTime: new Date(now).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      vitals: entries,
    }
    onInsertRow(slot)
    toast.success(`${entries.length}개 항목이 체크리스트에 추가되었습니다.`)
    if (!memo) handleClose()
    else setVitals(null)
  }

  const [savingMemo, setSavingMemo] = useState(false)

  const handleSaveMemo = async () => {
    if (!memo?.trim()) return
    setSavingMemo(true)
    const { error } = await appendVoiceMemoToSession(sessionId, memo.trim())
    setSavingMemo(false)
    if (error) {
      toast.error('실시간 기록 저장 실패')
      return
    }
    toast.success('실시간 기록에 저장되었습니다.')
    if (!vitals || vitals.length === 0) handleClose()
    else setMemo(null)
  }

  const handleReset = () => {
    setVitals(null)
    setMemo(null)
    setCorrectedTranscript(null)
    setFinalText('')
    setInterimText('')
    transcriptRef.current = ''
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

  const hasResult = vitals !== null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Mic size={13} />
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
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={() => { if (recording) stopRecording() }}
                onTouchStart={(e) => { e.preventDefault(); startRecording() }}
                onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
                onTouchCancel={(e) => { e.preventDefault(); stopRecording() }}
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
            <div className="w-full flex flex-col gap-3">
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

              {/* 추출 수치 */}
              {vitals && vitals.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-slate-500 font-medium">추출된 수치 ({vitals.length}개)</p>
                  <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
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
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">
                  수치가 인식되지 않았습니다.
                </p>
              )}

              {/* 메모성 내용 → 실시간 기록 저장 */}
              {memo && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2.5 flex flex-col gap-2">
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    <span className="font-medium">실시간 기록: </span>{memo}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs self-end border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    onClick={handleSaveMemo}
                    disabled={savingMemo}
                  >
                    {savingMemo
                      ? <LoaderCircle size={11} className="animate-spin" />
                      : <NotebookPen size={11} />
                    }
                    실시간 기록에 저장
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={handleReset}>
                  <RotateCcw size={12} />
                  다시 입력
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClose}>
                  취소
                </Button>
                <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleConfirm}
                  disabled={!vitals || vitals.filter(v => v.value.trim()).length === 0}>
                  <CheckCircle2 size={13} />
                  체크리스트에 추가
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
