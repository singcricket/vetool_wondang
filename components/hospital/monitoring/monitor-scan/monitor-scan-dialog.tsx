'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, LoaderCircle, ScanLine, Trash2, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { scanMonitorImage } from '@/lib/actions/monitoring/monitor-scan-action'
import type { DeviceProfile, MonitorScanResult, MonitorScanAssessment } from '@/types/monitoring/device-profile-type'
import type { VitalEntry, VitalTimeSlot } from '@/types/monitoring/monitoring-type'
import type { VitalRefRange } from '@/types/adimin'

interface Props {
  sessionId: string
  hosId: string
  profiles: DeviceProfile[]
  vitalRefRange: VitalRefRange[]
  recentSlots: VitalTimeSlot[]
  species: 'canine' | 'feline' | null
  sessionTitle: string | null
  startTime: string | null
  intervalSetting: number | null
  onInsertRow: (slot: VitalTimeSlot) => void
}

function calcMinTime(nowMs: number, startTime: string | null, intervalSetting: number | null): string {
  if (!startTime) return '0'
  const elapsedMin = Math.floor((nowMs - new Date(startTime).getTime()) / 60000)
  const clamped = Math.max(0, elapsedMin)
  if (!intervalSetting || intervalSetting <= 1) return String(clamped)
  return String(Math.floor(clamped / intervalSetting) * intervalSetting)
}

const NO_PROFILE = '__no_profile__'
const LS_KEY = (hosId: string) => `ms_device_profile_${hosId}`

export default function MonitorScanDialog({
  sessionId,
  hosId,
  profiles,
  vitalRefRange,
  recentSlots,
  species,
  sessionTitle,
  startTime,
  intervalSetting,
  onInsertRow,
}: Props) {
  const [open, setOpen] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string>(() => {
    if (typeof window === 'undefined') return profiles[0]?.id ?? NO_PROFILE
    const saved = localStorage.getItem(LS_KEY(hosId))
    const exists = saved && profiles.some((p) => p.id === saved)
    return exists ? saved : (profiles[0]?.id ?? NO_PROFILE)
  })
  const [scanning, setScanning] = useState(false)
  const [vitals, setVitals] = useState<MonitorScanResult[] | null>(null)
  const [assessment, setAssessment] = useState<MonitorScanAssessment | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectedProfileId !== NO_PROFILE) {
      localStorage.setItem(LS_KEY(hosId), selectedProfileId)
    }
  }, [selectedProfileId, hosId])

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null

  const handleFileChange = async (file: File) => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setVitals(null)
    setAssessment(null)
    setScanning(true)

    try {
      const base64 = await compressAndConvert(file)

      if (!selectedProfile) {
        toast.error('장비 프로파일을 선택하세요.')
        return
      }

      const { data, error } = await scanMonitorImage({
        base64Image: base64,
        profile: selectedProfile,
        vitalRefRange,
        recentSlots,
        species,
        sessionTitle,
      })

      if (error || !data) {
        toast.error(error ?? '분석 실패')
        return
      }

      setVitals(data.vitals)
      setAssessment(data.assessment)
    } catch {
      toast.error('이미지 분석 중 오류가 발생했습니다.')
    } finally {
      setScanning(false)
    }
  }

  const updateVital = (idx: number, field: Partial<MonitorScanResult>) => {
    if (!vitals) return
    setVitals(vitals.map((r, i) => (i === idx ? { ...r, ...field } : r)))
  }

  const removeVital = (idx: number) => {
    if (!vitals) return
    setVitals(vitals.filter((_, i) => i !== idx))
  }

  const handleConfirm = () => {
    if (!vitals || vitals.length === 0) return

    const entries: VitalEntry[] = vitals
      .filter((r) => r.value.trim() !== '')
      .map((r) => ({ vitalName: r.vital_name, value: r.value }))

    if (entries.length === 0) {
      toast.error('입력할 수치가 없습니다.')
      return
    }

    const now = Date.now()
    const slot: VitalTimeSlot = {
      create_timestamp: String(now),
      minTime: calcMinTime(now, startTime, intervalSetting),
      vitals: entries,
    }

    onInsertRow(slot)
    toast.success(`${entries.length}개 항목이 체크리스트에 추가되었습니다.`)
    handleClose()
  }

  const handleClose = () => {
    setOpen(false)
    setVitals(null)
    setAssessment(null)
    setPreviewUrl(null)
    setScanning(false)
  }

  const hasAlerts = (assessment?.alerts?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="h-10 gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4">
          <Camera size={16} />
          사진으로 입력
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine size={16} />
            모니터 사진으로 수치 입력
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          {/* 장비 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">장비 프로파일</span>
            {profiles.length === 0 ? (
              <p className="text-xs text-amber-600">장비 설정에서 프로파일을 먼저 추가하세요.</p>
            ) : (
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.device_name}
                      {p.field_mappings.length > 0 && (
                        <span className="ml-1 text-slate-400 text-[10px]">
                          (매핑 {p.field_mappings.filter((m) => m.our_vital).length}개)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 이미지 업로드 */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileChange(file)
              e.target.value = ''
            }}
          />

          {previewUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-44">
              <img src={previewUrl} alt="모니터 사진" className="w-full object-contain max-h-44" />
              {scanning && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-white text-sm">
                  <LoaderCircle size={22} className="animate-spin" />
                  <span>수치 추출 + 임상 분석 중...</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-8 text-slate-400 hover:border-teal-400 hover:text-teal-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={profiles.length === 0}
            >
              <Camera size={28} />
              <span className="text-sm">탭하여 사진 촬영 또는 선택</span>
            </button>
          )}

          {previewUrl && !scanning && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 self-start"
              onClick={() => fileInputRef.current?.click()}>
              <Camera size={12} />
              다시 촬영
            </Button>
          )}

          {/* ── AI 임상 해석 패널 ── */}
          {assessment && !scanning && (
            <div className={`rounded-lg border px-3 py-2.5 flex flex-col gap-2 text-xs ${
              hasAlerts
                ? 'border-amber-300 bg-amber-50'
                : 'border-emerald-200 bg-emerald-50'
            }`}>
              {/* 상태 요약 */}
              <div className="flex items-start gap-1.5">
                {hasAlerts
                  ? <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  : <Info size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                }
                <p className={hasAlerts ? 'text-amber-800' : 'text-emerald-800'}>
                  {assessment.status}
                </p>
              </div>

              {/* 알림 항목 */}
              {assessment.alerts.length > 0 && (
                <ul className="flex flex-col gap-0.5 pl-5">
                  {assessment.alerts.map((alert, i) => (
                    <li key={i} className="text-amber-700 list-disc">{alert}</li>
                  ))}
                </ul>
              )}

              {/* 대응 방법 */}
              {assessment.suggestions.length > 0 && (
                <div className="border-t border-amber-200 pt-2 flex flex-col gap-0.5">
                  <p className="font-medium text-slate-600 mb-0.5">권장 조치</p>
                  <ul className="flex flex-col gap-0.5 pl-5">
                    {assessment.suggestions.map((s, i) => (
                      <li key={i} className="text-slate-700 list-disc">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── 수치 확인 테이블 ── */}
          {vitals && vitals.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 font-medium">
                추출된 수치 ({vitals.length}개) — 수정 후 확인하세요
              </p>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {vitals.map((r, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-[1fr_80px_28px] gap-1 items-center rounded px-2 py-1.5 border text-xs ${
                      r.is_abnormal
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <span
                      className={`truncate ${r.is_abnormal ? 'text-amber-700 font-medium' : 'text-slate-600'}`}
                      title={`원본: ${r.device_label}`}
                    >
                      {r.vital_name}
                      {r.is_abnormal && <AlertTriangle size={10} className="inline ml-1 text-amber-500" />}
                    </span>
                    <Input
                      className={`h-6 text-xs px-1 text-right ${r.is_abnormal ? 'border-amber-300' : ''}`}
                      value={r.value}
                      onChange={(e) => updateVital(idx, { value: e.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-300 hover:text-red-400"
                      onClick={() => removeVital(idx)}
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClose}>
                  취소
                </Button>
                <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleConfirm}>
                  <CheckCircle2 size={13} />
                  체크리스트에 추가
                </Button>
              </div>
            </div>
          )}

          {vitals && vitals.length === 0 && !scanning && (
            <p className="text-center text-xs text-slate-400 py-2">
              인식된 수치가 없습니다. 다시 촬영해보세요.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

async function compressAndConvert(file: File, maxPx = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1])
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
