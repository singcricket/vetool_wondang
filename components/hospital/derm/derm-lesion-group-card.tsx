'use client'

import { useState, useRef } from 'react'
import { Loader2, Wand2, Brain, Trash2, ChevronDown, ChevronUp, X, Plus, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { DermLesionGroup, DermLesionVisit, DermImage, ImprovementType } from '@/types/hospital/derm-type'
import {
  SEVERITY_CONFIG, IMPROVEMENT_CONFIG, LESION_TYPES,
} from '@/types/hospital/derm-type'
import { convertToFormalFindings, analyzeLesionGroup } from '@/lib/actions/derm/derm-ai-actions'
import { uploadDermImage } from '@/lib/services/derm/upload-derm-image'
import { insertDermImage, deleteDermImage } from '@/lib/actions/derm/derm-image-actions'

interface VisitState {
  rawInput: string
  formalFindings: string
  lesionTypes: string[]
  aiAnalysis: DermLesionVisit['ai_analysis']
  severity: number | null
  improvement: ImprovementType | null
  aiComparisonNotes: string | null
}

interface Props {
  group: DermLesionGroup
  visit: VisitState
  images: DermImage[]
  isFollowup: boolean
  hosId: string
  chartId: string
  patient: { name?: string | null; species?: string | null; breed?: string | null; gender?: string | null; birth?: string | null } | null
  isMarkingActive: boolean
  onToggleMarking: () => void
  onVisitChange: (groupId: string, update: Partial<VisitState>) => void
  onImageAdded: (img: DermImage) => void
  onImageDeleted: (imgId: string) => void
  onDelete: (groupId: string) => void
}

export default function DermLesionGroupCard({
  group, visit, images, isFollowup, hosId, chartId, patient,
  isMarkingActive, onToggleMarking, onVisitChange, onImageAdded, onImageDeleted, onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [isConverting, setIsConverting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const groupImages = images.filter((img) => img.lesion_group_id === group.id && img.image_type === 'detail')

  // ── 구어체 → 정식 용어 변환 ─────────────────────────────────

  const handleConvert = async () => {
    if (!visit.rawInput.trim()) return
    setIsConverting(true)
    try {
      const { formalFindings, suggestedLesionTypes } = await convertToFormalFindings(
        visit.rawInput,
        patient,
      )
      onVisitChange(group.id, {
        formalFindings,
        lesionTypes: suggestedLesionTypes.length > 0 ? suggestedLesionTypes : visit.lesionTypes,
      })
      toast.success('용어 변환 완료')
    } catch {
      toast.error('변환에 실패했습니다.')
    } finally {
      setIsConverting(false)
    }
  }

  // ── AI 전체 분석 ─────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (groupImages.length === 0) {
      toast.error('세부 사진을 먼저 업로드해주세요.')
      return
    }
    setIsAnalyzing(true)
    try {
      // fetch images as base64
      const imageDataList = await Promise.all(
        groupImages.slice(0, 20).map(async (img) => {
          const res = await fetch(img.image_url)
          const blob = await res.blob()
          return new Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }>(
            (resolve) => {
              const reader = new FileReader()
              reader.onload = () => {
                const dataUrl = reader.result as string
                const [header, base64] = dataUrl.split(',')
                const raw = header.replace('data:', '').replace(';base64', '')
                const mediaType = raw === 'image/png' || raw === 'image/webp' ? raw : 'image/jpeg'
                resolve({ base64, mediaType: mediaType as any })
              }
              reader.readAsDataURL(blob)
            },
          )
        }),
      )

      const aiAnalysis = await analyzeLesionGroup(imageDataList, visit.rawInput, patient)
      onVisitChange(group.id, {
        aiAnalysis,
        severity: aiAnalysis.severity,
        lesionTypes: aiAnalysis.lesion_type.length > 0 ? aiAnalysis.lesion_type : visit.lesionTypes,
      })
      toast.success('AI 분석 완료')
    } catch {
      toast.error('AI 분석에 실패했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ── 이미지 업로드 ─────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setIsUploading(true)
    try {
      for (const file of files) {
        const { url, error } = await uploadDermImage(file, chartId, 'detail')
        if (error || !url) throw new Error(error || '업로드 실패')
        const inserted = await insertDermImage({
          hosId, chartId, lesionGroupId: group.id,
          imageType: 'detail', imageUrl: url,
          sortOrder: groupImages.length,
        })
        onImageAdded(inserted)
      }
      toast.success(`${files.length}장 업로드 완료`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async (img: DermImage) => {
    try {
      await deleteDermImage(img.id, img.image_url, hosId)
      onImageDeleted(img.id)
    } catch {
      toast.error('이미지 삭제 실패')
    }
  }

  const toggleLesionType = (value: string) => {
    const next = visit.lesionTypes.includes(value)
      ? visit.lesionTypes.filter((t) => t !== value)
      : [...visit.lesionTypes, value]
    onVisitChange(group.id, { lesionTypes: next })
  }

  return (
    <div className="rounded-2xl border-2 bg-white shadow-sm overflow-hidden" style={{ borderColor: group.group_color ?? '#e2e8f0' }}>
      {/* Group header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: `${group.group_color}15` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-black text-white shadow"
            style={{ background: group.group_color ?? '#6b7280' }}
          >
            {group.group_label}
          </span>
          <div>
            <span className="font-bold text-slate-800 text-sm">{group.group_label}그룹</span>
            {visit.lesionTypes.length > 0 && (
              <span className="ml-2 text-xs text-slate-500">
                {visit.lesionTypes.slice(0, 2).map((t) => {
                  const found = LESION_TYPES.find((lt) => lt.value === t)
                  return found ? `${found.label}` : t
                }).join(', ')}
                {visit.lesionTypes.length > 2 && ` +${visit.lesionTypes.length - 2}`}
              </span>
            )}
          </div>
          {visit.severity && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${SEVERITY_CONFIG[visit.severity]?.badge}`}>
              {SEVERITY_CONFIG[visit.severity]?.label}
            </span>
          )}
          {isFollowup && visit.improvement && (
            <span className={`text-sm ${IMPROVEMENT_CONFIG[visit.improvement]?.color}`}>
              {IMPROVEMENT_CONFIG[visit.improvement]?.icon} {IMPROVEMENT_CONFIG[visit.improvement]?.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="전체사진에 마커 추가"
            onClick={onToggleMarking}
            className={`rounded-full p-1.5 transition-colors ${
              isMarkingActive
                ? 'text-white shadow'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            style={isMarkingActive ? { background: group.group_color ?? '#6b7280' } : undefined}
          >
            <MapPin className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(group.id)}
            className="rounded-full p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Detail images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">세부 사진</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                사진 추가
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {groupImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {groupImages.map((img) => (
                  <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image_url} alt="병변 사진" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void handleDeleteImage(img)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-slate-200 text-xs text-slate-400 cursor-pointer hover:border-emerald-300 hover:text-emerald-600 transition-colors"
              >
                클릭하여 세부 사진 업로드
              </div>
            )}
          </div>

          {/* Raw input + Convert */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">소견 입력 (구어체 가능)</label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleConvert}
                disabled={isConverting || !visit.rawInput.trim()}
                className="h-7 gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                {isConverting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                AI 변환
              </Button>
            </div>
            <textarea
              value={visit.rawInput}
              onChange={(e) => onVisitChange(group.id, { rawInput: e.target.value })}
              placeholder={`예: "겨드랑이에 가운데 농이 진 동그란 병변이 여러개 보여"`}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-300"
            />

            {visit.formalFindings && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">정식 소견</p>
                <p className="text-xs text-slate-800 leading-relaxed">{visit.formalFindings}</p>
              </div>
            )}
          </div>

          {/* Lesion type tags */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">병변 종류</p>
            <div className="flex flex-wrap gap-1.5">
              {LESION_TYPES.map((lt) => {
                const selected = visit.lesionTypes.includes(lt.value)
                return (
                  <button
                    key={lt.value}
                    type="button"
                    onClick={() => toggleLesionType(lt.value)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                      selected
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                    style={selected ? { background: group.group_color ?? '#10b981', borderColor: group.group_color ?? '#10b981' } : undefined}
                  >
                    {lt.label} <span className="opacity-60">{lt.labelEn}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">심각도</p>
            <div className="flex gap-2 flex-wrap">
              {([1, 2, 3, 4] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onVisitChange(group.id, { severity: visit.severity === g ? null : g })}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    visit.severity === g ? SEVERITY_CONFIG[g].badge + ' border-current' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${SEVERITY_CONFIG[g].dot}`} />
                  {SEVERITY_CONFIG[g].label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up improvement */}
          {isFollowup && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">호전도</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(IMPROVEMENT_CONFIG) as ImprovementType[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onVisitChange(group.id, { improvement: visit.improvement === key ? null : key })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      visit.improvement === key
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {IMPROVEMENT_CONFIG[key].icon} {IMPROVEMENT_CONFIG[key].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis button + results */}
          <div className="pt-1">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || groupImages.length === 0}
              variant="outline"
              className="w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {isAnalyzing
                ? <><Loader2 className="h-4 w-4 animate-spin" /> AI 분석 중...</>
                : <><Brain className="h-4 w-4" /> AI 분석 ({groupImages.length}장)</>}
            </Button>

            {visit.aiAnalysis && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">AI 분석 결과</p>

                {visit.aiAnalysis.anatomical_location && (
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold">위치:</span> {visit.aiAnalysis.anatomical_location}
                  </p>
                )}

                <p className="text-xs text-slate-700 leading-relaxed">{visit.aiAnalysis.description}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">신뢰도:</span>
                  <span className="text-xs font-bold text-amber-700">
                    {Math.round((visit.aiAnalysis.confidence ?? 0) * 100)}%
                  </span>
                </div>

                {visit.aiAnalysis.differential.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 mb-1">감별진단</p>
                    <div className="flex flex-wrap gap-1">
                      {visit.aiAnalysis.differential.map((d, i) => (
                        <span key={d} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          i === 0 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-600 border-slate-200'
                        }`}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {visit.aiAnalysis.recommended_tests.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 mb-1">추천 검사</p>
                    <ul className="space-y-0.5">
                      {visit.aiAnalysis.recommended_tests.map((t) => (
                        <li key={t} className="text-[11px] text-slate-600 flex gap-1">
                          <span className="text-amber-500 shrink-0">·</span>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {visit.aiAnalysis.immediate_action && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2">
                    <p className="text-[10px] font-black text-rose-700 uppercase mb-0.5">즉각 조치</p>
                    <p className="text-xs text-rose-900">{visit.aiAnalysis.immediate_action}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
