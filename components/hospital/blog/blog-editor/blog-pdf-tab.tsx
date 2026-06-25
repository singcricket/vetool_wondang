'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'
import {
  uploadBlogPdfToStorage,
  extractBlogFromPdf,
  saveBlogLabData,
  type BlogPdfExtractionResult,
  type BlogExtractedSection,
} from '@/lib/actions/blog/blog-pdf-actions'
import { updateBlogContent, updateBlogPost } from '@/lib/actions/blog/blog-actions'
import type { BlogSection, BlogSpecies, BlogPatient } from '@/types/hospital/blog-type'
import type { LabSeverity } from '@/constants/hospital/checkup/lab-ref'

interface Props {
  hosId: string
  postId: string
  currentSpecies?: BlogSpecies | ''
  extraNotes?: string
  onApply: (patch: {
    content: BlogSection[]
    diagnosis?: string
    summary?: string
    species?: BlogSpecies | ''
    patient?: BlogPatient | null
  }) => void
}

const SEVERITY_BADGE: Record<LabSeverity, string> = {
  critical: 'bg-red-600 text-white',
  high:     'bg-orange-500 text-white',
  moderate: 'bg-yellow-400 text-slate-800',
  mild:     'bg-slate-200 text-slate-700',
}

function buildSectionsFromExtraction(sections: BlogExtractedSection[]): BlogSection[] {
  const result: BlogSection[] = []
  for (const s of sections) {
    if (s.title_vet === '질병 안내' || s.title_owner === '이 질병에 대하여') {
      result.push({ type: 'disease_info', title: s.title_vet, body: s.body_vet, audience: 'vet' })
      result.push({ type: 'disease_info', title: s.title_owner, body: s.body_owner, audience: 'owner' })
    } else {
      result.push({ type: 'section', title: s.title_vet, body: s.body_vet, audience: 'vet' })
      result.push({ type: 'section', title: s.title_owner, body: s.body_owner, audience: 'owner' })
    }
  }
  return result
}

export default function BlogPdfTab({ hosId, postId, currentSpecies, extraNotes, onApply }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BlogPdfExtractionResult | null>(null)
  const [previewAudience, setPreviewAudience] = useState<'vet' | 'owner'>('vet')
  const [applying, setApplying] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('PDF 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > 32 * 1024 * 1024) {
      toast.error('파일 크기는 32MB 이하여야 합니다.')
      return
    }

    setFileName(file.name)
    setLoading(true)
    setResult(null)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const data = reader.result as string
          resolve(data.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const [pdfPath, extraction] = await Promise.all([
        uploadBlogPdfToStorage(hosId, postId, base64),
        extractBlogFromPdf(hosId, postId, base64, currentSpecies || undefined, extraNotes || undefined),
      ])

      if (extraction.error || !extraction.data) {
        toast.error(extraction.error ?? 'AI 분석 실패')
        return
      }

      setResult(extraction.data)

      if (extraction.data.lab_sessions.length > 0) {
        await saveBlogLabData(hosId, postId, extraction.data.lab_sessions, pdfPath)
      }

      toast.success('AI 분석 완료')
    } catch (err) {
      toast.error('분석 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleApply = async () => {
    if (!result) return
    setApplying(true)
    try {
      const content = buildSectionsFromExtraction(result.sections)

      // DB에 즉시 저장
      await Promise.all([
        updateBlogContent(hosId, postId, content),
        updateBlogPost(hosId, postId, {
          ...(result.diagnosis && { diagnosis: result.diagnosis }),
          ...(result.summary && { summary: result.summary }),
          ...(result.species && { species: result.species as BlogSpecies }),
        }),
      ])

      // 로컬 폼 상태 반영
      onApply({
        content,
        diagnosis: result.diagnosis || undefined,
        summary: result.summary || undefined,
        species: (result.species as BlogSpecies) || undefined,
        patient: result.patient ?? undefined,
      })
      toast.success('초안이 저장됐습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setApplying(false)
    }
  }

  const abnormalItems = (result?.lab_sessions ?? []).flatMap((s) =>
    s.items.filter((it) => it.is_abnormal === true).map((it) => ({ ...it, sessionLabel: s.label || s.date }))
  )

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      <div
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
        {loading ? (
          <>
            <Loader2 size={28} className="animate-spin text-teal-500" />
            <p className="text-sm text-slate-500">AI가 PDF를 분석하는 중입니다…</p>
            {fileName && <p className="text-xs text-slate-400">{fileName}</p>}
          </>
        ) : result ? (
          <>
            <CheckCircle2 size={28} className="text-teal-500" />
            <p className="text-sm font-medium text-teal-700">분석 완료 — 다른 PDF로 재분석하려면 클릭</p>
            {fileName && <p className="text-xs text-slate-400">{fileName}</p>}
          </>
        ) : (
          <>
            <Upload size={28} className="text-slate-400" />
            <p className="text-sm font-medium text-slate-600">EMR PDF를 여기에 업로드</p>
            <p className="text-xs text-slate-400">클릭하거나 파일을 드래그하세요 (최대 32MB)</p>
          </>
        )}
      </div>

      {/* 결과 미리보기 */}
      {result && (
        <div className="space-y-4">
          {/* 환자 연결 결과 */}
          {result.patient && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2.5',
              result.patient.is_new
                ? 'border-teal-200 bg-teal-50'
                : 'border-slate-200 bg-slate-50'
            )}>
              <User size={14} className={result.patient.is_new ? 'text-teal-500' : 'text-slate-400'} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-semibold', result.patient.is_new ? 'text-teal-700' : 'text-slate-700')}>
                  {result.patient.is_new ? '신규 환자 등록 및 연결됨' : '기존 환자 연결됨'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {result.patient.name} · {result.patient.breed} · {result.patient.hos_patient_id}
                  {result.patient.owner_name && ` · 보호자 ${result.patient.owner_name}`}
                </p>
              </div>
            </div>
          )}

          {/* 진단·요약 */}
          {(result.diagnosis || result.summary) && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 space-y-1.5">
              {result.diagnosis && (
                <p className="text-sm"><span className="font-medium text-slate-700">진단명: </span><span className="text-slate-600">{result.diagnosis}</span></p>
              )}
              {result.summary && (
                <p className="text-sm"><span className="font-medium text-slate-700">요약: </span><span className="text-slate-600">{result.summary}</span></p>
              )}
              {result.species && (
                <p className="text-sm"><span className="font-medium text-slate-700">종: </span><span className="text-slate-600">{result.species}</span></p>
              )}
            </div>
          )}

          {/* 섹션 미리보기 */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">섹션 미리보기 ({result.sections.length}개)</span>
              </div>
              <div className="flex rounded-md border border-slate-200 overflow-hidden text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewAudience('vet')}
                  className={cn('px-3 py-1 transition-colors', previewAudience === 'vet' ? 'bg-violet-100 text-violet-700 font-semibold' : 'text-slate-400 hover:text-slate-600')}
                >
                  수의사
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAudience('owner')}
                  className={cn('px-3 py-1 transition-colors border-l border-slate-200', previewAudience === 'owner' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-slate-400 hover:text-slate-600')}
                >
                  보호자
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {result.sections.map((s, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="mb-1 text-xs font-semibold text-slate-700">
                    {previewAudience === 'vet' ? s.title_vet : s.title_owner}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {previewAudience === 'vet' ? s.body_vet : s.body_owner}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 이상 혈액검사 */}
          {abnormalItems.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50/40">
              <div className="flex items-center gap-1.5 border-b border-orange-100 px-4 py-2.5">
                <AlertCircle size={14} className="text-orange-500" />
                <span className="text-xs font-semibold text-orange-700">이상 항목 ({abnormalItems.length}개)</span>
              </div>
              <div className="divide-y divide-orange-100">
                {abnormalItems.map((item, i) => (
                  <div key={`${item.id}-${i}`} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <span className="text-xs font-medium text-slate-700">{item.nameKo}</span>
                      <span className="ml-1 text-[10px] text-slate-400">({item.nameEn})</span>
                      {item.sessionLabel && (
                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{item.sessionLabel}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">{item.value} {item.unit}</span>
                      {item.ref_range && (
                        <span className="text-[10px] text-slate-400">ref: {item.ref_range}</span>
                      )}
                      {item.severity && (
                        <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold', SEVERITY_BADGE[item.severity])}>
                          {item.severity}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* unmatched lab */}
          {result.unmatched_lab.length > 0 && (
            <p className="text-xs text-slate-400">
              미매핑 항목 {result.unmatched_lab.length}개: {result.unmatched_lab.map((u) => u.nameEn).join(', ')}
            </p>
          )}

          {/* 적용 버튼 */}
          <Button
            onClick={handleApply}
            disabled={applying}
            className="w-full bg-teal-600 text-xs hover:bg-teal-700"
          >
            {applying && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            초안 본문에 적용
          </Button>
        </div>
      )}
    </div>
  )
}
