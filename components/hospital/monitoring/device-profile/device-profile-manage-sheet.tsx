'use client'

import { useState, useTransition, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Settings, Plus, Trash2, Camera, LoaderCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createDeviceProfile,
  updateDeviceProfile,
  deleteDeviceProfile,
  saveCalibrationResult,
} from '@/lib/actions/monitoring/device-profile-actions'
import { calibrateMonitorImage } from '@/lib/actions/monitoring/monitor-scan-action'
import type { DeviceProfile, FieldMapping, CalibrationExtractedItem } from '@/types/monitoring/device-profile-type'
import { VITAL_NAMES } from '@/types/monitoring/device-profile-type'

interface Props {
  hosId: string
  profiles: DeviceProfile[]
  onProfilesChange: (profiles: DeviceProfile[]) => void
}

const IGNORE_VALUE = '__ignore__'

export default function DeviceProfileManageSheet({ hosId, profiles, onProfilesChange }: Props) {
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [calibrating, setCalibrating] = useState<string | null>(null) // profileId
  const [calibResult, setCalibResult] = useState<{
    profileId: string
    extracted: CalibrationExtractedItem[]
    mappings: FieldMapping[]
    layoutHint: string
  } | null>(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    startTransition(async () => {
      try {
        const created = await createDeviceProfile({ hosId, deviceName: newName.trim() })
        onProfilesChange([...profiles, created])
        setNewName('')
        setExpandedId(created.id)
        toast.success('장비 프로파일이 추가되었습니다.')
      } catch {
        toast.error('프로파일 추가 실패')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteDeviceProfile(id)
        onProfilesChange(profiles.filter((p) => p.id !== id))
        if (expandedId === id) setExpandedId(null)
        if (calibResult?.profileId === id) setCalibResult(null)
        toast.success('프로파일이 삭제되었습니다.')
      } catch {
        toast.error('프로파일 삭제 실패')
      }
    })
  }

  const handleCalibUpload = async (profileId: string, file: File) => {
    setCalibrating(profileId)
    try {
      const base64 = await fileToBase64(file)
      const { data, error } = await calibrateMonitorImage(base64)
      if (error || !data) {
        toast.error(error ?? '분석 실패')
        return
      }
      const profile = profiles.find((p) => p.id === profileId)!
      // 기존 매핑 있으면 유지, 새 라벨은 기본값으로 추가
      const existingLabels = new Set(profile.field_mappings.map((m) => m.device_label))
      const merged: FieldMapping[] = [...profile.field_mappings]
      for (const item of data) {
        if (!existingLabels.has(item.label)) {
          const autoMatch = VITAL_NAMES.find(
            (n) => n.toLowerCase().includes(item.label.toLowerCase()) ||
                   item.label.toLowerCase().includes(n.split('(')[0].toLowerCase()),
          )
          merged.push({ device_label: item.label, our_vital: autoMatch ?? null, parse_hint: null })
        }
      }
      setCalibResult({ profileId, extracted: data, mappings: merged, layoutHint: profile.layout_hint ?? '' })
    } catch {
      toast.error('이미지 분석 중 오류가 발생했습니다.')
    } finally {
      setCalibrating(null)
    }
  }

  const handleSaveCalib = (profileId: string) => {
    if (!calibResult || calibResult.profileId !== profileId) return
    const profile = profiles.find((p) => p.id === profileId)!
    startTransition(async () => {
      try {
        const newSample = {
          raw_extracted: calibResult.extracted,
          confirmed: calibResult.extracted,
          memo: null,
        }
        await saveCalibrationResult({
          profileId,
          fieldMappings: calibResult.mappings,
          layoutHint: calibResult.layoutHint || null,
          newSample,
          existingSamples: profile.verified_samples,
        })
        onProfilesChange(
          profiles.map((p) =>
            p.id === profileId
              ? { ...p, field_mappings: calibResult.mappings, layout_hint: calibResult.layoutHint || null }
              : p,
          ),
        )
        setCalibResult(null)
        toast.success('캘리브레이션이 저장되었습니다.')
      } catch {
        toast.error('저장 실패')
      }
    })
  }

  const updateMapping = (profileId: string, idx: number, field: Partial<FieldMapping>) => {
    if (!calibResult || calibResult.profileId !== profileId) return
    const next = calibResult.mappings.map((m, i) => (i === idx ? { ...m, ...field } : m))
    setCalibResult({ ...calibResult, mappings: next })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-slate-500">
          <Settings size={13} />
          장비 설정
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>모니터링 장비 프로파일</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-4">
          {/* 새 프로파일 추가 */}
          <div className="flex gap-2">
            <Input
              placeholder="장비 이름 (예: 수술방 필립스 A)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="h-8 text-sm"
            />
            <Button size="sm" className="h-8 gap-1" onClick={handleCreate} disabled={!newName.trim() || isPending}>
              <Plus size={13} />
              추가
            </Button>
          </div>

          <Separator />

          {profiles.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-4">등록된 장비 프로파일이 없습니다.</p>
          )}

          {profiles.map((profile) => (
            <div key={profile.id} className="rounded-lg border border-slate-200 bg-slate-50">
              {/* 프로파일 헤더 */}
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  onClick={() => setExpandedId(expandedId === profile.id ? null : profile.id)}
                >
                  {expandedId === profile.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {profile.device_name}
                  {profile.field_mappings.length > 0 && (
                    <span className="text-xs text-slate-400">
                      (매핑 {profile.field_mappings.filter((m) => m.our_vital).length}개)
                    </span>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                  onClick={() => handleDelete(profile.id)}
                  disabled={isPending}
                >
                  <Trash2 size={13} />
                </Button>
              </div>

              {/* 펼쳐진 상태 */}
              {expandedId === profile.id && (
                <div className="border-t border-slate-200 px-3 py-3 flex flex-col gap-3">
                  {/* 화면 구조 힌트 */}
                  {calibResult?.profileId === profile.id ? (
                    <div>
                      <Label className="text-xs text-slate-500">화면 구조 힌트 (AI 컨텍스트)</Label>
                      <Textarea
                        className="mt-1 text-xs min-h-[56px] resize-none"
                        placeholder="예: 좌상단 HR 노란색 큰 숫자, 우측 SpO2 파란색..."
                        value={calibResult.layoutHint}
                        onChange={(e) => setCalibResult({ ...calibResult, layoutHint: e.target.value })}
                      />
                    </div>
                  ) : profile.layout_hint ? (
                    <p className="text-xs text-slate-500 bg-white rounded p-2 border border-slate-100">
                      {profile.layout_hint}
                    </p>
                  ) : null}

                  {/* 캘리브레이션 */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs text-slate-500">캘리브레이션 (모니터 사진 업로드)</Label>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleCalibUpload(profile.id, file)
                        e.target.value = ''
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={calibrating === profile.id}
                    >
                      {calibrating === profile.id ? (
                        <LoaderCircle size={13} className="animate-spin" />
                      ) : (
                        <Camera size={13} />
                      )}
                      {calibrating === profile.id ? 'AI 분석 중...' : '사진 업로드 → AI 분석'}
                    </Button>
                  </div>

                  {/* 매핑 테이블 (캘리브레이션 결과 또는 기존 매핑) */}
                  {calibResult?.profileId === profile.id ? (
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs text-slate-500">
                        감지된 항목 ({calibResult.mappings.length}개) — 매핑을 확인/수정하세요
                      </Label>
                      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                        {calibResult.mappings.map((m, idx) => {
                          const extracted = calibResult.extracted.find((e) => e.label === m.device_label)
                          return (
                            <div key={idx} className="grid grid-cols-[100px_1fr_80px] gap-1 items-center bg-white rounded px-2 py-1.5 border border-slate-100 text-xs">
                              <span className="font-mono text-slate-600 truncate">
                                {m.device_label}
                                {extracted && <span className="ml-1 text-slate-400">= {extracted.value}</span>}
                              </span>
                              <Select
                                value={m.our_vital ?? IGNORE_VALUE}
                                onValueChange={(v) => updateMapping(profile.id, idx, { our_vital: v === IGNORE_VALUE ? null : v })}
                              >
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={IGNORE_VALUE}>— 무시 —</SelectItem>
                                  {VITAL_NAMES.map((name) => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                className="h-6 text-xs px-1"
                                placeholder="파싱 힌트"
                                value={m.parse_hint ?? ''}
                                onChange={(e) => updateMapping(profile.id, idx, { parse_hint: e.target.value || null })}
                              />
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCalibResult(null)}>
                          취소
                        </Button>
                        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleSaveCalib(profile.id)} disabled={isPending}>
                          <CheckCircle2 size={12} />
                          저장
                        </Button>
                      </div>
                    </div>
                  ) : profile.field_mappings.length > 0 ? (
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {profile.field_mappings.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1 border border-slate-100">
                          <span className="font-mono w-24 truncate text-slate-500">{m.device_label}</span>
                          <span className="text-slate-400">→</span>
                          <span className={m.our_vital ? 'text-slate-700' : 'text-slate-300 italic'}>
                            {m.our_vital ?? '무시'}
                          </span>
                          {m.parse_hint && <span className="text-slate-400 text-[10px]">({m.parse_hint})</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">
                      사진을 업로드해서 캘리브레이션을 진행하세요.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const maxPx = 1280
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
