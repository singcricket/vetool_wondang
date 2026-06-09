'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { toast } from 'sonner'
import {
  Upload,
  Loader2,
  CheckCircle2,
  Circle,
  ImageIcon,
  Sparkles,
  X,
  ZoomIn,
  Eye,
  ScanText,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  uploadAndProcessEchoScanImage,
  updateScanImageMatchedFields,
  deleteEchoScanImage,
  generateEchoFinding,
  type EchoScanImage,
  type MatchedField,
} from '@/lib/actions/echocardio/echo-scan-actions'
import type { Species } from '@/types/echocardio/echocardio-type'
import { ECHO_SECTION_LIST } from '@/types/echocardio/echocardio-type'
import { useEchoContext } from '@/providers/echo-context-provider'

interface Props {
  echoId: string
  hosId: string
  species: Species
  initialImages: EchoScanImage[]
  resultMap: Record<string, string>
  onApplyField: (keywordId: string, value: string) => void
  onFindingGenerated: (memo: string) => void
}

// Canvas 압축 (1600px, JPEG 82%)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1600
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const base64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1]
      resolve(base64)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function EchoInputScanMode({
  echoId,
  hosId,
  species,
  initialImages,
  resultMap,
  onApplyField,
  onFindingGenerated,
}: Props) {
  const [images, setImages] = useState<EchoScanImage[]>(initialImages)
  const [selectedId, setSelectedId] = useState<string | null>(initialImages[0]?.id ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null)
  const [generatingFinding, startGeneratingFinding] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedImage = images.find((img) => img.id === selectedId) ?? null

  // 단계별 메시지 + 진행 바 시뮬레이션
  // 실제 AI 분석 구간(9~22s)은 interval로 서서히 채움
  const startStatusSequence = () => {
    timersRef.current.forEach(clearTimeout)
    if (intervalRef.current) clearInterval(intervalRef.current)
    timersRef.current = []
    intervalRef.current = null

    setUploadProgress(0)

    const steps: [number, string, number][] = [
      [0,     '이미지 압축 중...',      5],
      [1500,  '서버 업로드 중...',      20],
      [4000,  '텍스트 인식(OCR) 중...', 42],
      [9000,  'AI 소견 분석 중...',     55],
      [22000, '결과 저장 중...',        92],
    ]

    steps.forEach(([delay, msg, progress]) => {
      const t = setTimeout(() => {
        setUploadStatus(msg)
        setUploadProgress(progress)
      }, delay)
      timersRef.current.push(t)
    })

    // AI 분석 구간: 9s~22s 동안 55→91%까지 서서히 증가
    const aiStart = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 91) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            return 91
          }
          return prev + 1.5
        })
      }, 800)
    }, 9000)
    timersRef.current.push(aiStart)
  }

  const stopStatusSequence = () => {
    timersRef.current.forEach(clearTimeout)
    if (intervalRef.current) clearInterval(intervalRef.current)
    timersRef.current = []
    intervalRef.current = null
    setUploadStatus('')
    setUploadProgress(0)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    setUploading(true)
    startStatusSequence()
    try {
      const newImages: EchoScanImage[] = []
      for (const file of files) {
        const base64 = await compressImage(file)
        const img = await uploadAndProcessEchoScanImage(hosId, echoId, base64, file.name, species)
        newImages.push(img)
      }
      setUploadProgress(100)
      setImages((prev) => {
        const next = [...prev, ...newImages]
        if (!selectedId) setSelectedId(next[0]?.id ?? null)
        return next
      })
      if (newImages.length) setSelectedId(newImages[newImages.length - 1].id)
      toast.success(`${newImages.length}장 업로드 완료`)
    } catch (err: any) {
      toast.error(`업로드 실패: ${err?.message ?? '알 수 없는 오류'}`)
    } finally {
      stopStatusSequence()
      setUploading(false)
    }
  }

  const handleDelete = async (img: EchoScanImage) => {
    setDeletingId(img.id)
    try {
      await deleteEchoScanImage(img.id, img.file_path)
      setImages((prev) => {
        const next = prev.filter((i) => i.id !== img.id)
        if (selectedId === img.id) setSelectedId(next[0]?.id ?? null)
        return next
      })
      toast.success('이미지 삭제됨')
    } catch {
      toast.error('삭제 실패')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleApply = useCallback(
    async (img: EchoScanImage, field: MatchedField) => {
      const updated = img.matched_fields.map((f) =>
        f.keyword_id === field.keyword_id ? { ...f, applied: !f.applied } : f,
      )

      // 낙관적 업데이트
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, matched_fields: updated } : i)),
      )

      // 적용 체크 시 부모 onApplyField 호출
      if (!field.applied) {
        onApplyField(field.keyword_id, field.value)
      }

      try {
        await updateScanImageMatchedFields(img.id, updated)
      } catch {
        // 롤백
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, matched_fields: img.matched_fields } : i)),
        )
        toast.error('저장 실패')
      }
    },
    [onApplyField],
  )

  const handleApplyAll = useCallback(
    async (img: EchoScanImage) => {
      const updated = img.matched_fields.map((f) => ({ ...f, applied: true }))
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, matched_fields: updated } : i)),
      )
      img.matched_fields.forEach((f) => {
        if (!f.applied) onApplyField(f.keyword_id, f.value)
      })
      try {
        await updateScanImageMatchedFields(img.id, updated)
        toast.success('모든 항목 적용됨')
      } catch {
        toast.error('저장 실패')
      }
    },
    [onApplyField],
  )

  const handleEditField = useCallback(
    async (img: EchoScanImage, oldKeywordId: string, updatedField: MatchedField) => {
      const updated = img.matched_fields.map((f) =>
        f.keyword_id === oldKeywordId ? updatedField : f,
      )
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, matched_fields: updated } : i)),
      )
      try {
        await updateScanImageMatchedFields(img.id, updated)
      } catch {
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, matched_fields: img.matched_fields } : i)),
        )
        toast.error('저장 실패')
      }
    },
    [],
  )

  const handleDeleteField = useCallback(
    async (img: EchoScanImage, keywordId: string) => {
      const updated = img.matched_fields.filter((f) => f.keyword_id !== keywordId)
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, matched_fields: updated } : i)),
      )
      try {
        await updateScanImageMatchedFields(img.id, updated)
      } catch {
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, matched_fields: img.matched_fields } : i)),
        )
        toast.error('삭제 실패')
      }
    },
    [],
  )

  const handleGenerateFinding = () => {
    startGeneratingFinding(async () => {
      try {
        const memo = await generateEchoFinding(hosId, echoId, resultMap, species)
        onFindingGenerated(memo)
        toast.success('AI 소견서가 생성되어 메모란에 저장되었습니다.')
      } catch (err: any) {
        toast.error(err?.message ?? 'AI 소견서 생성 실패')
      }
    })
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      {/* ── 왼쪽 패널: 이미지 썸네일 목록 ── */}
      <div className="flex w-56 shrink-0 flex-col overflow-hidden border-r bg-slate-50">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-[11px] font-semibold text-slate-500">스캔 이미지</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* 업로드 진행 상태 */}
        {uploading && (
          <div className="border-b bg-teal-50 px-3 py-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Loader2 size={11} className="shrink-0 animate-spin text-teal-500" />
              <span className="text-[11px] text-teal-700">{uploadStatus}</span>
            </div>
            {/* 진행 바 */}
            <div className="h-1 w-full rounded-full bg-teal-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-700 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {/* 화면 이탈 경고 (OCR 이후 단계부터) */}
            {uploadProgress >= 42 && (
              <p className="text-[10px] text-amber-600 font-medium">
                ⚠ 분석이 완료될 때까지 이 화면을 유지해 주세요
              </p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {images.length === 0 && !uploading && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <ImageIcon size={24} className="text-slate-300" />
              <p className="text-[10px] text-slate-400">이미지를 업로드하세요</p>
            </div>
          )}

          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedId(img.id)}
              className={cn(
                'relative h-36 shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all group',
                selectedId === img.id
                  ? 'border-teal-500 shadow-sm'
                  : 'border-transparent hover:border-slate-300',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.public_url}
                alt={img.file_name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(img) }}
                disabled={deletingId === img.id}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deletingId === img.id
                  ? <Loader2 size={10} className="animate-spin" />
                  : <X size={10} />}
              </button>

              {/* 적용 현황 배지 */}
              {img.matched_fields.length > 0 && (
                <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white">
                  {img.matched_fields.filter((f) => f.applied).length}/{img.matched_fields.length}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI 소견서 생성 버튼 */}
        <div className="border-t p-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-[11px] gap-1 border-violet-300 text-violet-700 hover:bg-violet-50"
            onClick={handleGenerateFinding}
            disabled={generatingFinding}
          >
            {generatingFinding
              ? <Loader2 size={12} className="animate-spin" />
              : <Sparkles size={12} />}
            AI 소견서
          </Button>
        </div>
      </div>

      {/* ── 오른쪽 패널: 선택된 이미지 + 매칭 항목 ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        {!selectedImage ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
            <ImageIcon size={40} className="text-slate-200" />
            <p className="text-sm">이미지를 선택하거나 업로드하세요</p>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Upload size={14} className="mr-1" />
              이미지 업로드
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* 이미지 미리보기 */}
            <div className="relative flex w-1/2 shrink-0 items-center justify-center overflow-hidden border-r bg-black/5 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.public_url}
                alt={selectedImage.file_name}
                className="max-h-full max-w-full cursor-zoom-in rounded object-contain shadow"
                onClick={() => setFullscreenUrl(selectedImage.public_url)}
              />
              <button
                onClick={() => setFullscreenUrl(selectedImage.public_url)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <ZoomIn size={14} />
              </button>
              {selectedImage.mode_label && (
                <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                  {selectedImage.mode_label}
                </div>
              )}
            </div>

            {/* 매칭 항목 목록 */}
            <div className="flex flex-1 flex-col overflow-hidden min-h-0">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <p className="text-xs font-semibold text-slate-600">
                  AI 매칭 항목
                  <span className="ml-1 font-normal text-slate-400">
                    ({selectedImage.matched_fields.length}개)
                  </span>
                </p>
                {selectedImage.matched_fields.some((f) => !f.applied) && (
                  <button
                    onClick={() => handleApplyAll(selectedImage)}
                    className="text-[11px] font-medium text-teal-600 hover:text-teal-800"
                  >
                    전체 적용
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {selectedImage.matched_fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <p className="text-xs text-slate-400">
                      {selectedImage.ocr_raw_text
                        ? 'AI가 매칭 가능한 항목을 찾지 못했습니다.'
                        : 'OCR 텍스트를 추출할 수 없었습니다.'}
                    </p>
                    {selectedImage.ocr_raw_text && (
                      <details className="w-full text-left">
                        <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-600">
                          OCR 원문 보기
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-2 text-[10px] text-slate-600">
                          {selectedImage.ocr_raw_text}
                        </pre>
                      </details>
                    )}
                  </div>
                ) : (
                  <MatchedFieldList
                    image={selectedImage}
                    species={species}
                    onToggle={(field) => handleToggleApply(selectedImage, field)}
                    onEdit={(oldId, updated) => handleEditField(selectedImage, oldId, updated)}
                    onDelete={(keywordId) => handleDeleteField(selectedImage, keywordId)}
                  />
                )}
              </div>

              {/* OCR 원문 */}
              {selectedImage.ocr_raw_text && (
                <details className="border-t px-3 py-2">
                  <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-600">
                    OCR 원문
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-[10px] text-slate-600">
                    {selectedImage.ocr_raw_text}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 전체화면 모달 */}
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setFullscreenUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullscreenUrl}
            alt="fullscreen"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-2xl"
          />
          <button
            onClick={() => setFullscreenUrl(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

// OCR(수치)와 Vision(주관적 소견)을 섹션으로 나눠 표시
function MatchedFieldList({
  image,
  species,
  onToggle,
  onEdit,
  onDelete,
}: {
  image: EchoScanImage
  species: Species
  onToggle: (field: MatchedField) => void
  onEdit: (oldKeywordId: string, updated: MatchedField) => void
  onDelete: (keywordId: string) => void
}) {
  const ocrFields = image.matched_fields.filter((f) => f.source === 'ocr')
  const visionFields = image.matched_fields.filter((f) => f.source === 'vision')

  return (
    <div className="flex flex-col gap-4">
      {visionFields.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Eye size={12} className="text-violet-500" />
            <span className="text-[11px] font-semibold text-violet-600">이미지 직접 분석 소견</span>
            <span className="text-[10px] text-slate-400">({visionFields.length}개)</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {visionFields.map((field) => (
              <MatchedFieldRow
                key={field.keyword_id}
                field={field}
                species={species}
                onToggle={() => onToggle(field)}
                onEdit={(updated) => onEdit(field.keyword_id, updated)}
                onDelete={() => onDelete(field.keyword_id)}
              />
            ))}
          </div>
        </div>
      )}

      {ocrFields.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <ScanText size={12} className="text-teal-500" />
            <span className="text-[11px] font-semibold text-teal-600">OCR 수치 추출</span>
            <span className="text-[10px] text-slate-400">({ocrFields.length}개)</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {ocrFields.map((field) => (
              <MatchedFieldRow
                key={field.keyword_id}
                field={field}
                species={species}
                onToggle={() => onToggle(field)}
                onEdit={(updated) => onEdit(field.keyword_id, updated)}
                onDelete={() => onDelete(field.keyword_id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MatchedFieldRow({
  field,
  species,
  onToggle,
  onEdit,
  onDelete,
}: {
  field: MatchedField
  species: Species
  onToggle: () => void
  onEdit: (updated: MatchedField) => void
  onDelete: () => void
}) {
  const { echoContextData } = useEchoContext()
  const { testUIMeta } = echoContextData

  const [editing, setEditing] = useState(false)
  const [draftKeywordId, setDraftKeywordId] = useState(field.keyword_id)
  const [draftValue, setDraftValue] = useState(field.value)

  const filteredMeta = testUIMeta.filter(
    (m) => m.species.includes(species) && m.testType !== 'textcomment',
  )
  const selectedMeta = filteredMeta.find((m) => m.keywordID === draftKeywordId)
  const isSelectType = selectedMeta?.testType === 'select'

  function handleKeywordChange(id: string) {
    setDraftKeywordId(id)
    setDraftValue('')
  }

  function handleSave() {
    const meta = filteredMeta.find((m) => m.keywordID === draftKeywordId)
    onEdit({
      ...field,
      keyword_id: draftKeywordId,
      keyword_name: meta?.keywordName ?? field.keyword_name,
      unit: meta?.unit ?? '',
      value: draftValue,
    })
    setEditing(false)
  }

  function handleCancel() {
    setDraftKeywordId(field.keyword_id)
    setDraftValue(field.value)
    setEditing(false)
  }

  const isVision = field.source === 'vision'
  const activeClass = isVision ? 'border-violet-200 bg-violet-50' : 'border-teal-200 bg-teal-50'
  const hoverClass = isVision
    ? 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'
    : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'
  const checkColor = isVision ? 'text-violet-500' : 'text-teal-500'
  const valueColor = isVision ? 'text-violet-700' : 'text-teal-700'

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
        {/* 검사 항목 선택 */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500">검사 항목</span>
          <select
            value={draftKeywordId}
            onChange={(e) => handleKeywordChange(e.target.value)}
            className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            {ECHO_SECTION_LIST.map((section) => {
              const sectionFields = filteredMeta.filter((m) => m.sections.includes(section))
              if (!sectionFields.length) return null
              return (
                <optgroup key={section} label={section}>
                  {sectionFields.map((m) => (
                    <option key={m.keywordID} value={m.keywordID}>
                      {m.keywordName}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </div>

        {/* 결과값 입력 */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500">
            결과값{selectedMeta?.unit ? ` (${selectedMeta.unit})` : ''}
          </span>
          {isSelectType ? (
            <select
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="">선택...</option>
              {selectedMeta?.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-400"
              placeholder="값 입력"
            />
          )}
        </div>

        {/* 저장 / 취소 */}
        <div className="flex justify-end gap-1.5">
          <button
            onClick={handleCancel}
            className="rounded px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-200"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!draftValue.trim()}
            className="rounded bg-teal-600 px-2 py-0.5 text-[11px] text-white hover:bg-teal-700 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors',
        field.applied ? activeClass : hoverClass,
      )}
    >
      {/* 적용 토글 */}
      <button type="button" onClick={onToggle} className="mt-0.5 shrink-0">
        {field.applied
          ? <CheckCircle2 size={15} className={checkColor} />
          : <Circle size={15} className="text-slate-300" />}
      </button>

      {/* 항목 내용 */}
      <button type="button" onClick={onToggle} className="flex-1 min-w-0 text-left">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-slate-800">{field.keyword_name}</span>
          <span className={cn('text-sm font-bold', valueColor)}>
            {field.value}
            {field.unit && <span className="ml-0.5 text-[11px] font-normal text-slate-400">{field.unit}</span>}
          </span>
        </div>
        {field.raw_text && (
          <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-400">{field.raw_text}</p>
        )}
      </button>

      {/* 신뢰도 + 편집/삭제 버튼 */}
      <div className="flex shrink-0 items-center gap-1 self-center">
        <span className={cn(
          'rounded px-1.5 py-0.5 text-[10px] font-medium',
          field.confidence >= 0.9
            ? 'bg-emerald-100 text-emerald-700'
            : field.confidence >= 0.7
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-100 text-slate-500',
        )}>
          {Math.round(field.confidence * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-5 w-5 items-center justify-center rounded opacity-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 transition-opacity"
        >
          <Pencil size={11} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-5 w-5 items-center justify-center rounded opacity-0 text-slate-400 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}
