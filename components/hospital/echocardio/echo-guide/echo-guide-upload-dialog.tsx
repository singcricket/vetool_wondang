'use client'

import { useState, useTransition } from 'react'
import { insertEchoGuideImage } from '@/lib/services/echocardio/echo-guide-image'
import { useEchoContext } from '@/providers/echo-context-provider'

interface EchoGuideUploadDialogProps {
  hosId: string
  onClose: () => void
  onUploaded: () => void
}

export default function EchoGuideUploadDialog({
  hosId,
  onClose,
  onUploaded,
}: EchoGuideUploadDialogProps) {
  const { echoContextData } = useEchoContext()
  const { testUIMeta } = echoContextData

  const [viewName, setViewName] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function toggleKeyword(keywordId: string) {
    setSelectedKeywords((prev) =>
      prev.includes(keywordId)
        ? prev.filter((k) => k !== keywordId)
        : [...prev, keywordId],
    )
  }

  async function handleUpload() {
    if (!imageFile || !viewName.trim()) return
    setIsUploading(true)
    try {
      // 이미지 업로드 API
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('hos_id', hosId)
      formData.append('folder', 'echo-guide')

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('이미지 업로드 실패')
      const { url } = await res.json()

      startTransition(async () => {
        await insertEchoGuideImage({
          hosId,
          viewName: viewName.trim(),
          imageUrl: url,
          mappedKeywords: selectedKeywords,
          displayOrder: 0,
        })
        onUploaded()
        onClose()
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsUploading(false)
    }
  }

  // 섹션별 항목 그룹
  const nonCommentMeta = testUIMeta.filter(
    (m) => m.testType !== 'textcomment',
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">가이드 이미지 업로드</span>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* 뷰 이름 */}
        <div className="flex items-center gap-2">
          <label className="w-20 shrink-0 text-xs text-muted-foreground">
            뷰 이름*
          </label>
          <input
            type="text"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="예: 5chamber long axis"
            className="flex-1 rounded border px-2 py-1 text-xs"
          />
        </div>

        {/* 이미지 업로드 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">이미지 파일*</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-xs"
          />
          {previewUrl && (
            <div className="relative mt-1 aspect-video w-full overflow-hidden rounded border bg-muted">
              <img
                src={previewUrl}
                alt="preview"
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>

        {/* 측정 항목 선택 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            이 뷰에서 측정할 항목 선택
          </label>
          <div className="max-h-48 overflow-y-auto rounded border p-2">
            {nonCommentMeta.map((m) => (
              <label
                key={m.keywordID}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selectedKeywords.includes(m.keywordID)}
                  onChange={() => toggleKeyword(m.keywordID)}
                  className="h-3 w-3"
                />
                <span className="text-xs">
                  {m.keywordName}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({m.section})
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 업로드 버튼 */}
        <button
          onClick={handleUpload}
          disabled={isUploading || isPending || !imageFile || !viewName.trim()}
          className="rounded bg-black py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {isUploading || isPending ? '업로드 중...' : '업로드'}
        </button>
      </div>
    </div>
  )
}
