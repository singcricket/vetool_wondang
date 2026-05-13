'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { analyzeToFormFields } from '@/lib/actions/cytology/ai-cytology-analyze'
import type { CytologySampleType } from '@/constants/hospital/cytology/cytology-types'

interface Props {
  sampleType: CytologySampleType
  onFill: (findings: Record<string, string | string[]>, summary: string) => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp']
const MAX_BYTES = 5 * 1024 * 1024

function convertBmpToPng(
  file: File,
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas unavailable')); return }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(blobUrl)
      const dataUrl = canvas.toDataURL('image/png')
      const [header, base64] = dataUrl.split(',')
      resolve({ base64, mediaType: header.replace('data:', '').replace(';base64', '') })
    }
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('load fail')) }
    img.src = blobUrl
  })
}

export default function CytologyAiFillButton({ sampleType, onFill }: Props) {
  const [analyzing, setAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.bmp')) {
      toast.error('이미지 파일만 지원합니다 (JPEG, PNG, WebP, BMP)')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('파일 크기는 5MB 이하여야 합니다')
      return
    }

    setAnalyzing(true)
    try {
      let base64: string
      let mediaType: string

      if (file.type === 'image/bmp' || file.name.toLowerCase().endsWith('.bmp')) {
        const converted = await convertBmpToPng(file)
        base64 = converted.base64
        mediaType = converted.mediaType
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const [header, b64] = dataUrl.split(',')
        base64 = b64
        mediaType = header.replace('data:', '').replace(';base64', '')
      }

      const result = await analyzeToFormFields(
        base64,
        mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
        sampleType,
      )

      const fieldCount = Object.keys(result.findings).length
      if (fieldCount === 0) {
        toast.warning('AI가 소견을 인식하지 못했습니다. 직접 입력해주세요.')
      } else {
        onFill(result.findings, result.summary)
        toast.success(`AI가 ${fieldCount}개 항목을 자동 입력했습니다.`)
      }
    } catch {
      toast.error('AI 분석에 실패했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  return (
    <>
      <button
        type="button"
        disabled={analyzing}
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-all ${
          analyzing
            ? 'border-violet-200 bg-violet-50 text-violet-400 cursor-not-allowed'
            : 'border-violet-300 bg-white text-violet-700 hover:border-violet-500 hover:bg-violet-50'
        }`}
        title="이미지를 업로드하면 AI가 소견을 자동으로 입력합니다"
      >
        {analyzing ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
            AI 분석 중...
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            AI 자동입력
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp,.bmp"
        className="hidden"
        onChange={handleChange}
      />
    </>
  )
}
