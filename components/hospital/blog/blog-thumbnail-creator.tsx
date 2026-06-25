'use client'

import { useRef, useState, useTransition } from 'react'
import { Loader2, Sparkles, Download, RefreshCw, Save, CheckCircle2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { generateThumbnailContent, type ThumbnailContent } from '@/lib/actions/blog/blog-thumbnail-actions'
import { saveThumbnailAsCover } from '@/lib/actions/blog/blog-image-actions'
import type { BlogPost } from '@/types/hospital/blog-type'
import { THUMBNAIL_TAG } from '@/types/hospital/blog-type'
import { cn } from '@/lib/utils/utils'

// ── 진료분야별 색상 ──────────────────────────────────────────
const CATEGORY_COLOR: Record<string, { from: string; to: string; badge: string }> = {
  외과:     { from: '#0f4c81', to: '#1a6bb5', badge: '#3b82f6' },
  안과:     { from: '#4c1d95', to: '#6d28d9', badge: '#8b5cf6' },
  치과:     { from: '#064e3b', to: '#065f46', badge: '#10b981' },
  내과:     { from: '#1e3a5f', to: '#1e40af', badge: '#3b82f6' },
  소화기:   { from: '#14532d', to: '#166534', badge: '#16a34a' },
  심혈관계: { from: '#7f1d1d', to: '#991b1b', badge: '#ef4444' },
  신경계:   { from: '#1e1b4b', to: '#312e81', badge: '#6366f1' },
  피부과:   { from: '#831843', to: '#9d174d', badge: '#ec4899' },
  종양:     { from: '#431407', to: '#7c2d12', badge: '#f97316' },
  정형외과: { from: '#0c4a6e', to: '#075985', badge: '#0ea5e9' },
  응급:     { from: '#450a0a', to: '#7f1d1d', badge: '#ef4444' },
}
function getCategoryColor(category: string) {
  const first = category.split(',')[0].trim()
  return CATEGORY_COLOR[first] ?? { from: '#0f4c81', to: '#134e7c', badge: '#3b82f6' }
}

// ── 테마 목록 ────────────────────────────────────────────────
type Theme = 'dark' | 'light' | 'gradient'
const THEMES: { key: Theme; label: string }[] = [
  { key: 'dark', label: '다크' },
  { key: 'light', label: '라이트' },
  { key: 'gradient', label: '그라데이션' },
]

// ── 썸네일 카드 (1200×630 → 미리보기는 600×315) ──────────────
interface CardProps {
  content: ThumbnailContent
  post: BlogPost
  theme: Theme
  thumbnailImageUrl: string | null
  innerRef?: React.Ref<HTMLDivElement>
}

function ThumbnailCard({ content, post, theme, thumbnailImageUrl, innerRef }: CardProps) {
  const colors = getCategoryColor(post.case_category)
  const date = new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
  const species = post.species === 'canine' ? '개' : post.species === 'feline' ? '고양이' : post.species === 'exotic' ? '특수동물' : ''

  const bgStyle: React.CSSProperties =
    theme === 'dark'
      ? { background: `linear-gradient(135deg, ${colors.from} 0%, #0a0a0a 100%)` }
      : theme === 'gradient'
      ? { background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 50%, #1e293b 100%)` }
      : { background: '#ffffff' }

  const textColor = theme === 'light' ? '#0f172a' : '#ffffff'
  const subColor = theme === 'light' ? '#475569' : 'rgba(255,255,255,0.7)'
  const pointBg = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'
  const textWidth = thumbnailImageUrl ? 740 : 1200

  return (
    <div
      ref={innerRef}
      style={{
        width: 1200,
        height: 630,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
        display: 'flex',
        ...bgStyle,
      }}
    >
      <div style={{ position: 'absolute', top: -120, right: thumbnailImageUrl ? 340 : -80, width: 400, height: 400, borderRadius: '50%', background: `${colors.badge}22` }} />
      <div style={{ position: 'absolute', bottom: -100, left: -60, width: 300, height: 300, borderRadius: '50%', background: `${colors.badge}15` }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: colors.badge }} />

      <div style={{ width: textWidth, position: 'relative', padding: '52px 60px 52px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ background: colors.badge, color: '#fff', fontSize: 22, fontWeight: 700, padding: '6px 20px', borderRadius: 999 }}>
            {content.badge}
          </span>
          {species && <span style={{ color: subColor, fontSize: 20, fontWeight: 500 }}>{species}</span>}
        </div>

        <div>
          <div style={{ color: textColor, fontSize: thumbnailImageUrl ? 56 : 64, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 16 }}>
            {content.headline}
          </div>
          <div style={{ color: subColor, fontSize: 26, fontWeight: 500 }}>
            {content.subline}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {content.points.map((p, i) => (
            <div key={i} style={{ background: pointBg, color: textColor, fontSize: 18, fontWeight: 600, padding: '8px 16px', borderRadius: 10, backdropFilter: 'blur(4px)' }}>
              {p}
            </div>
          ))}
        </div>

        <div style={{ color: subColor, fontSize: 18 }}>{date}</div>
      </div>

      {thumbnailImageUrl && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 1,
            background: theme === 'light'
              ? 'linear-gradient(to right, #ffffff, transparent)'
              : theme === 'gradient'
              ? `linear-gradient(to right, ${colors.to}, transparent)`
              : `linear-gradient(to right, #0a0a0a, transparent)`,
          }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailImageUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
    </div>
  )
}

// ── canvas → base64 헬퍼 ─────────────────────────────────────
async function captureCardAsBase64(el: HTMLDivElement): Promise<string> {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(el, {
    scale: 1,
    useCORS: true,
    backgroundColor: null,
    width: 1200,
    height: 630,
  })
  // "data:image/png;base64,..." 에서 base64 부분만 추출
  return canvas.toDataURL('image/png').split(',')[1]
}

// ── URL → 로컬 다운로드 헬퍼 ─────────────────────────────────
async function downloadFromUrl(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = blobUrl
  link.click()
  URL.revokeObjectURL(blobUrl)
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
interface Props {
  post: BlogPost
}

export default function BlogThumbnailCreator({ post }: Props) {
  const [content, setContent] = useState<ThumbnailContent | null>(null)
  const [theme, setTheme] = useState<Theme>('dark')
  const [isPending, startTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [savedCoverUrl, setSavedCoverUrl] = useState<string | null>(post.cover_image_url ?? null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const thumbnailImage = (post.images ?? []).find((img) => img.tags.includes(THUMBNAIL_TAG))
  const thumbnailImageUrl = thumbnailImage?.image_url ?? null
  const filename = `thumbnail_${post.id.slice(0, 8)}.png`

  const patchContent = (patch: Partial<ThumbnailContent>) =>
    setContent((prev) => prev ? { ...prev, ...patch } : prev)

  const updatePoint = (i: number, val: string) =>
    setContent((prev) => {
      if (!prev) return prev
      const points = [...prev.points]
      points[i] = val
      return { ...prev, points }
    })

  const addPoint = () =>
    setContent((prev) => {
      if (!prev || prev.points.length >= 3) return prev
      return { ...prev, points: [...prev.points, ''] }
    })

  const removePoint = (i: number) =>
    setContent((prev) => {
      if (!prev || prev.points.length <= 1) return prev
      return { ...prev, points: prev.points.filter((_, idx) => idx !== i) }
    })

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateThumbnailContent(post)
        setContent(result)
      } catch {
        toast.error('썸네일 텍스트 생성에 실패했습니다.')
      }
    })
  }

  const handleSaveCover = async () => {
    if (!cardRef.current) return
    setIsSaving(true)
    try {
      const base64 = await captureCardAsBase64(cardRef.current)
      const newUrl = await saveThumbnailAsCover(post.hos_id, post.id, base64, savedCoverUrl)
      setSavedCoverUrl(newUrl)
      toast.success('커버 이미지로 저장됐습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      if (savedCoverUrl) {
        // 저장된 URL에서 직접 다운로드
        await downloadFromUrl(savedCoverUrl, filename)
      } else if (cardRef.current) {
        // 아직 저장 전이면 캔버스 캡처로 다운로드
        const base64 = await captureCardAsBase64(cardRef.current)
        const link = document.createElement('a')
        link.download = filename
        link.href = `data:image/png;base64,${base64}`
        link.click()
      }
    } catch {
      toast.error('다운로드에 실패했습니다.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 썸네일 이미지 안내 */}
      {thumbnailImageUrl ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span className="font-semibold">썸네일</span> 태그 이미지가 카드 우측에 적용됩니다.
        </div>
      ) : (
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
          사진 탭에서 이미지에 <span className="font-semibold text-slate-500">썸네일</span> 태그를 붙이면 카드에 사진이 포함됩니다.
        </div>
      )}

      {/* 컨트롤 행 1: 생성 + 테마 */}
      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} disabled={isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
          {isPending
            ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />생성 중...</>
            : content
            ? <><RefreshCw className="mr-1.5 h-4 w-4" />다시 생성</>
            : <><Sparkles className="mr-1.5 h-4 w-4" />AI 썸네일 생성</>
          }
        </Button>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                theme === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 미리보기 */}
      {content ? (
        <>
          {/* 화면 표시용 — scale(0.5) 축소 미리보기, ref 없음 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-md">
            <div style={{ width: 600, height: 315, overflow: 'hidden', position: 'relative' }}>
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: 1200, height: 630 }}>
                <ThumbnailCard content={content} post={post} theme={theme} thumbnailImageUrl={thumbnailImageUrl} />
              </div>
            </div>
          </div>

          {/* 캡처 전용 — 실제 크기(1200×630), 화면 밖에 위치, ref 연결 */}
          <div aria-hidden="true" style={{ position: 'fixed', left: -9999, top: -9999, width: 1200, height: 630, pointerEvents: 'none', zIndex: -1 }}>
            <ThumbnailCard content={content} post={post} theme={theme} thumbnailImageUrl={thumbnailImageUrl} innerRef={cardRef} />
          </div>

          {/* 텍스트 편집 폼 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">텍스트 편집</p>

            {/* 뱃지 + 헤드라인 */}
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div>
                <label className="mb-0.5 block text-[10px] text-slate-400">뱃지</label>
                <input
                  value={content.badge}
                  onChange={(e) => patchContent({ badge: e.target.value })}
                  maxLength={8}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-teal-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-slate-400">헤드라인</label>
                <input
                  value={content.headline}
                  onChange={(e) => patchContent({ headline: e.target.value })}
                  maxLength={20}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            {/* 서브라인 */}
            <div>
              <label className="mb-0.5 block text-[10px] text-slate-400">서브라인</label>
              <input
                value={content.subline}
                onChange={(e) => patchContent({ subline: e.target.value })}
                maxLength={30}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-teal-400 focus:outline-none"
              />
            </div>

            {/* 포인트 */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] text-slate-400">포인트</label>
                {content.points.length < 3 && (
                  <button type="button" onClick={addPoint} className="flex items-center gap-0.5 text-[10px] text-teal-600 hover:text-teal-700">
                    <Plus className="h-3 w-3" />추가
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {content.points.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      value={p}
                      onChange={(e) => updatePoint(i, e.target.value)}
                      maxLength={14}
                      className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-teal-400 focus:outline-none"
                    />
                    {content.points.length > 1 && (
                      <button type="button" onClick={() => removePoint(i)} className="rounded p-0.5 text-slate-300 hover:text-rose-400">
                        <Minus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 컨트롤 행 2: 저장 + 다운로드 */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveCover}
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
            >
              {isSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" />저장 중...</>
                : <><Save className="h-4 w-4" />커버로 저장</>
              }
            </Button>

            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
              className="gap-1.5"
            >
              {isDownloading
                ? <><Loader2 className="h-4 w-4 animate-spin" />다운로드 중...</>
                : <><Download className="h-4 w-4" />PNG 저장</>
              }
            </Button>

            {savedCoverUrl && (
              <span className="ml-auto flex items-center gap-1 text-xs text-teal-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                커버 저장됨
              </span>
            )}
          </div>
        </>
      ) : (
        /* 미리보기 없을 때 — 기존 커버가 있으면 다운로드 제공 */
        <div className="space-y-3">
          <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
            AI 생성 버튼을 눌러 썸네일 텍스트를 만들어보세요
          </div>
          {savedCoverUrl && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
                저장된 커버 이미지 있음
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="gap-1.5 text-xs"
              >
                {isDownloading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Download className="h-3.5 w-3.5" />
                }
                PNG 저장
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
