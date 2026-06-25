'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  MousePointer2, Pencil, Type, Square, Circle, Trash2, Eraser,
  Loader2, Save, X, RotateCw, FlipHorizontal, FlipVertical, Crop,
  Contrast, Grid3x3,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateBlogImage, replaceBlogImageFile } from '@/lib/actions/blog/blog-image-actions'
import type { BlogImage } from '@/types/hospital/blog-type'
import { parseBlogImageCaption } from '@/lib/utils/blog-image-caption'

type EditorMode = 'select' | 'draw' | 'mosaic'

interface Props {
  image: BlogImage
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: (updated: BlogImage) => void
}

export default function BlogImageEditor({ image, open, onOpenChange, onSaved }: Props) {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const canvasCallbackRef = useCallback((el: HTMLCanvasElement | null) => setCanvasEl(el), [])

  const fabricRef = useRef<any>(null)
  const [mode, setMode] = useState<EditorMode>('select')
  const [color, setColor] = useState('#ef4444')
  const [isCropping, setIsCropping] = useState(false)
  const [isGrayscale, setIsGrayscale] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(image.image_url)
  const [description, setDescription] = useState(() => parseBlogImageCaption(image.caption).description ?? '')
  const [isPending, startTransition] = useTransition()
  const mosaicDragRef = useRef<{ startX: number; startY: number; previewRect: any } | null>(null)

  useEffect(() => {
    setCurrentImageUrl(image.image_url)
    const parsed = parseBlogImageCaption(image.caption)
    setDescription(parsed.description ?? '')
    setIsGrayscale(parsed.grayscale)
  }, [image.image_url, image.caption])

  // ── Fabric 캔버스 초기화 ────────────────────────────────────

  useEffect(() => {
    if (!open || !canvasEl) return
    let isMounted = true

    async function init() {
      const { fabric } = await import('fabric')
      if (!isMounted || !canvasEl) return

      const w = Math.min(window.innerWidth * 0.92, 1100)
      const h = Math.round(window.innerHeight - 80)

      const canvas = new fabric.Canvas(canvasEl, {
        isDrawingMode: false,
        width: w,
        height: h,
        selectionColor: 'rgba(99,102,241,0.2)',
        selectionBorderColor: '#6366f1',
        selectionLineWidth: 2,
        preserveObjectStacking: true,
      })
      fabricRef.current = canvas

      fabric.Image.fromURL(
        currentImageUrl,
        (img: any) => {
          if (!isMounted) return
          const canvasAspect = w / h
          const imgAspect = img.width! / img.height!
          const scale = canvasAspect >= imgAspect ? h / img.height! : w / img.width!
          img.set({ originX: 'center', originY: 'center', left: w / 2, top: h / 2, scaleX: scale, scaleY: scale, selectable: false, evented: false })
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))

          if (image.caption) {
            try {
              const parsed = JSON.parse(image.caption)
              if (parsed.objects !== undefined) {
                canvas.loadFromJSON(image.caption, () => {
                  if (!isMounted) return
                  if (parsed.origWidth && parsed.origHeight) {
                    const iA = img.width! / img.height!
                    const oldScale = (parsed.origWidth / parsed.origHeight) >= iA ? parsed.origHeight / img.height! : parsed.origWidth / img.width!
                    const newScale = canvasAspect >= iA ? h / img.height! : w / img.width!
                    const ratio = newScale / oldScale
                    canvas.getObjects().forEach((obj: any) => {
                      const relX = obj.left - parsed.origWidth / 2
                      const relY = obj.top - parsed.origHeight / 2
                      obj.set({ left: w / 2 + relX * ratio, top: h / 2 + relY * ratio, scaleX: (obj.scaleX || 1) * ratio, scaleY: (obj.scaleY || 1) * ratio })
                      obj.setCoords()
                    })
                  }
                  if (parsed.bgInfo) {
                    img.set({ angle: parsed.bgInfo.angle || 0, flipX: !!parsed.bgInfo.flipX, flipY: !!parsed.bgInfo.flipY })
                    const isVertical = (parsed.bgInfo.angle || 0) === 90 || (parsed.bgInfo.angle || 0) === 270
                    const iW = isVertical ? img.height! : img.width!
                    const iH = isVertical ? img.width! : img.height!
                    const s = canvasAspect >= iW / iH ? h / iH : w / iW
                    img.set({ scaleX: s, scaleY: s, left: w / 2, top: h / 2 })
                  }
                  // 흑백 필터 복원
                  if (parsed.grayscale) {
                    img.filters = [new fabric.Image.filters.Grayscale()]
                    img.applyFilters()
                    if (isMounted) setIsGrayscale(true)
                  }
                  canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
                  canvas.requestRenderAll()
                })
              }
            } catch { /* plain text caption */ }
          }
        },
        { crossOrigin: 'anonymous' },
      )

      canvas.on('selection:created', () => setMode('select'))
      canvas.on('text:editing:entered', () => {
        const ta = canvas.getElement().parentElement?.querySelector('textarea') as HTMLTextAreaElement | null
        if (ta) { ta.style.zIndex = '9999'; ta.focus() }
      })

      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        const active = canvas.getActiveObject() as any
        if (active?.isEditing) return
        if (e.key === 'Delete' || e.key === 'Backspace') {
          canvas.getActiveObjects().forEach((o: any) => canvas.remove(o))
          canvas.discardActiveObject()
          canvas.requestRenderAll()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }

    let keyCleanup: (() => void) | undefined
    init().then((fn) => { keyCleanup = fn })

    return () => {
      isMounted = false
      keyCleanup?.()
      fabricRef.current?.dispose()
      fabricRef.current = null
    }
  }, [open, canvasEl, currentImageUrl])

  // ── 선택/그리기 모드 전환 ────────────────────────────────────

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    if (mode === 'select' || mode === 'mosaic') {
      canvas.isDrawingMode = false
    } else if (mode === 'draw') {
      canvas.isDrawingMode = true
      import('fabric').then(({ fabric }) => {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
        canvas.freeDrawingBrush.color = color
        canvas.freeDrawingBrush.width = 4
      })
    }
    if (mode !== 'select') { canvas.discardActiveObject(); canvas.requestRenderAll() }
  }, [mode, color])

  // ── 모자이크 드래그 이벤트 ───────────────────────────────────

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || mode !== 'mosaic') return

    canvas.selection = false
    canvas.defaultCursor = 'crosshair'
    canvas.hoverCursor = 'crosshair'
    canvas.forEachObject((o: any) => o.set({ selectable: false, evented: false }))

    const onMouseDown = ({ e }: any) => {
      const ptr = canvas.getPointer(e)
      import('fabric').then(({ fabric }) => {
        const rect = new fabric.Rect({
          left: ptr.x, top: ptr.y, width: 1, height: 1,
          fill: 'rgba(251,191,36,0.1)', stroke: '#fbbf24',
          strokeWidth: 2, strokeDashArray: [5, 5],
          selectable: false, evented: false, id: 'mosaic-preview',
        } as any)
        canvas.add(rect)
        mosaicDragRef.current = { startX: ptr.x, startY: ptr.y, previewRect: rect }
        canvas.requestRenderAll()
      })
    }

    const onMouseMove = ({ e }: any) => {
      if (!mosaicDragRef.current) return
      const ptr = canvas.getPointer(e)
      const { startX, startY, previewRect } = mosaicDragRef.current
      const dx = ptr.x - startX
      const dy = ptr.y - startY
      previewRect.set({
        left: dx >= 0 ? startX : ptr.x,
        top: dy >= 0 ? startY : ptr.y,
        width: Math.abs(dx),
        height: Math.abs(dy),
      })
      canvas.requestRenderAll()
    }

    const onMouseUp = () => {
      if (!mosaicDragRef.current) return
      const { previewRect } = mosaicDragRef.current
      mosaicDragRef.current = null
      canvas.remove(previewRect)
      canvas.requestRenderAll()

      const left = Math.round(previewRect.left ?? 0)
      const top = Math.round(previewRect.top ?? 0)
      const width = Math.round(previewRect.width ?? 0)
      const height = Math.round(previewRect.height ?? 0)
      if (width > 8 && height > 8) applyMosaicPatch(left, top, width, height)
    }

    canvas.on('mouse:down', onMouseDown)
    canvas.on('mouse:move', onMouseMove)
    canvas.on('mouse:up', onMouseUp)

    return () => {
      canvas.off('mouse:down', onMouseDown)
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)
      canvas.selection = true
      canvas.defaultCursor = 'default'
      canvas.hoverCursor = 'move'
      canvas.forEachObject((o: any) => o.set({ selectable: true, evented: true }))
    }
  }, [mode])

  // ── 색상 변경 시 선택 오브젝트에 반영 ──────────────────────

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const obj = canvas.getActiveObject() as any
    if (!obj) return
    if (obj.type === 'i-text' || obj.type === 'text') obj.set('fill', color)
    else obj.set('stroke', color)
    canvas.requestRenderAll()
  }, [color])

  // ── 드로잉 도구 ──────────────────────────────────────────────

  const addText = () => {
    import('fabric').then(({ fabric }) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const t = new fabric.IText('텍스트', {
        left: canvas.width! / 2, top: canvas.height! / 2,
        fill: color, fontSize: 30, fontFamily: 'sans-serif', fontWeight: 'bold',
        originX: 'center', originY: 'center', padding: 8, editable: true,
      })
      canvas.add(t)
      canvas.setActiveObject(t)
      setMode('select')
      setTimeout(() => {
        t.enterEditing(); t.selectAll()
        const ta = canvas.getElement().parentElement?.querySelector('textarea') as HTMLTextAreaElement | null
        ta?.focus()
      }, 50)
    })
  }

  const addRect = () => {
    import('fabric').then(({ fabric }) => {
      const canvas = fabricRef.current
      if (!canvas) return
      canvas.add(new fabric.Rect({ left: canvas.width! / 2, top: canvas.height! / 2, fill: 'transparent', stroke: color, strokeWidth: 4, width: 150, height: 100, originX: 'center', originY: 'center' }))
      setMode('select')
    })
  }

  const addCircle = () => {
    import('fabric').then(({ fabric }) => {
      const canvas = fabricRef.current
      if (!canvas) return
      canvas.add(new fabric.Circle({ left: canvas.width! / 2, top: canvas.height! / 2, fill: 'transparent', stroke: color, strokeWidth: 4, radius: 60, originX: 'center', originY: 'center' }))
      setMode('select')
    })
  }

  const deleteSelected = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.getActiveObjects().forEach((o: any) => canvas.remove(o))
    canvas.discardActiveObject()
    canvas.requestRenderAll()
  }

  const clearAll = () => {
    const canvas = fabricRef.current
    if (!canvas || !confirm('모든 마킹을 지우시겠습니까?')) return
    canvas.clear()
    import('fabric').then(({ fabric }) => {
      fabric.Image.fromURL(currentImageUrl, (img: any) => {
        const w = canvas.width!, h = canvas.height!
        const scale = w / h >= img.width! / img.height! ? h / img.height! : w / img.width!
        img.set({ originX: 'center', originY: 'center', left: w / 2, top: h / 2, scaleX: scale, scaleY: scale, selectable: false, evented: false })
        if (isGrayscale) {
          img.filters = [new fabric.Image.filters.Grayscale()]
          img.applyFilters()
        }
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
      }, { crossOrigin: 'anonymous' })
    })
  }

  // ── 흑백 토글 ────────────────────────────────────────────────

  const toggleGrayscale = async () => {
    const canvas = fabricRef.current
    if (!canvas?.backgroundImage) return
    const { fabric } = await import('fabric')
    const bg = canvas.backgroundImage as any
    const next = !isGrayscale
    if (next) {
      bg.filters = [...(bg.filters ?? []), new fabric.Image.filters.Grayscale()]
    } else {
      bg.filters = (bg.filters ?? []).filter(
        (f: any) => !(f instanceof fabric.Image.filters.Grayscale),
      )
    }
    bg.applyFilters()
    canvas.renderAll()
    setIsGrayscale(next)
  }

  // ── 모자이크 패치 적용 ───────────────────────────────────────

  const applyMosaicPatch = async (left: number, top: number, width: number, height: number) => {
    const canvas = fabricRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL({ left, top, width, height, format: 'jpeg', quality: 0.9 })

    const pixelated = await new Promise<string>((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const blockSize = Math.max(6, Math.round(Math.min(width, height) / 10))
        const small = document.createElement('canvas')
        small.width = Math.max(1, Math.round(width / blockSize))
        small.height = Math.max(1, Math.round(height / blockSize))
        small.getContext('2d')!.drawImage(img, 0, 0, small.width, small.height)
        const out = document.createElement('canvas')
        out.width = width
        out.height = height
        const outCtx = out.getContext('2d')!
        outCtx.imageSmoothingEnabled = false
        outCtx.drawImage(small, 0, 0, width, height)
        resolve(out.toDataURL('image/jpeg', 0.9))
      }
      img.src = dataUrl
    })

    const { fabric } = await import('fabric')
    fabric.Image.fromURL(pixelated, (img: any) => {
      img.set({
        left: left + width / 2,
        top: top + height / 2,
        originX: 'center',
        originY: 'center',
      })
      canvas.add(img)
      canvas.requestRenderAll()
    })
  }

  // ── 회전 / 반전 ──────────────────────────────────────────────

  const rotate90 = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const bg = canvas.backgroundImage
    if (!bg) return
    const newAngle = ((bg.angle || 0) + 90) % 360
    bg.set('angle', newAngle)
    const isVertical = newAngle === 90 || newAngle === 270
    const w = isVertical ? bg.height! : bg.width!
    const h = isVertical ? bg.width! : bg.height!
    const scale = (canvas.width! / canvas.height!) >= w / h ? canvas.height! / h : canvas.width! / w
    bg.set({ scaleX: scale, scaleY: scale, left: canvas.width! / 2, top: canvas.height! / 2 })
    canvas.requestRenderAll()
  }

  const flipH = () => {
    const canvas = fabricRef.current
    if (!canvas?.backgroundImage) return
    canvas.backgroundImage.set('flipX', !canvas.backgroundImage.flipX)
    canvas.requestRenderAll()
  }

  const flipV = () => {
    const canvas = fabricRef.current
    if (!canvas?.backgroundImage) return
    canvas.backgroundImage.set('flipY', !canvas.backgroundImage.flipY)
    canvas.requestRenderAll()
  }

  // ── 자르기 ───────────────────────────────────────────────────

  const startCrop = () => {
    import('fabric').then(({ fabric }) => {
      const canvas = fabricRef.current
      if (!canvas) return
      setIsCropping(true)
      setMode('select')
      const rect = new fabric.Rect({
        left: canvas.width! / 4, top: canvas.height! / 4,
        width: canvas.width! / 2, height: canvas.height! / 2,
        fill: 'rgba(255,255,255,0.15)', stroke: '#fff',
        strokeWidth: 2, strokeDashArray: [5, 5],
        cornerColor: '#6366f1', cornerSize: 12, transparentCorners: false,
        id: 'crop-rect',
      } as any)
      canvas.add(rect)
      canvas.setActiveObject(rect)
      canvas.requestRenderAll()
    })
  }

  const cancelCrop = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const cropRect = canvas.getObjects().find((o: any) => o.id === 'crop-rect')
    if (cropRect) canvas.remove(cropRect)
    setIsCropping(false)
    canvas.requestRenderAll()
  }

  const applyCrop = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const cropRect = canvas.getObjects().find((o: any) => o.id === 'crop-rect')
    if (!cropRect) return
    if (!confirm('이미지를 자르면 현재 마킹이 모두 제거됩니다. 계속하시겠습니까?')) return

    startTransition(async () => {
      try {
        const bound = cropRect.getBoundingRect()
        canvas.getObjects().forEach((o: any) => o.set('visible', false))
        const dataURL = canvas.toDataURL({
          left: bound.left, top: bound.top,
          width: bound.width, height: bound.height,
          format: 'jpeg', quality: 0.9,
        })
        const base64 = dataURL.split(',')[1]
        const newUrl = await replaceBlogImageFile(
          image.id, image.hos_id, image.blog_post_id,
          currentImageUrl, base64, 'image/jpeg',
        )
        setCurrentImageUrl(newUrl)
        setIsCropping(false)
        onSaved({ ...image, image_url: newUrl, caption: null })
        toast.success('이미지가 잘렸습니다.')
      } catch {
        toast.error('자르기에 실패했습니다.')
        canvas.getObjects().forEach((o: any) => o.set('visible', true))
        canvas.requestRenderAll()
      }
    })
  }

  // ── 저장 ─────────────────────────────────────────────────────

  const handleSave = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    startTransition(async () => {
      try {
        const json = canvas.toJSON(['id', 'selectable', 'evented', 'editable']) as any
        delete json.backgroundImage
        json.bgInfo = canvas.backgroundImage
          ? { angle: canvas.backgroundImage.angle, flipX: canvas.backgroundImage.flipX, flipY: canvas.backgroundImage.flipY }
          : null
        json.origWidth = canvas.width
        json.origHeight = canvas.height
        json.description = description.trim() || null
        json.grayscale = isGrayscale
        const markStr = JSON.stringify(json)
        await updateBlogImage(image.id, { caption: markStr })
        onSaved({ ...image, caption: markStr })
        toast.success('저장됐습니다.')
        onOpenChange(false)
      } catch {
        toast.error('저장에 실패했습니다.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)} modal={false}>
      <DialogContent
        className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 border-0 flex flex-col bg-slate-900 rounded-none z-[100]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>이미지 편집</DialogTitle>
          <DialogDescription>마킹, 흑백, 모자이크 등 이미지를 편집합니다.</DialogDescription>
        </VisuallyHidden>

        {/* 툴바 */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-700 bg-slate-800 p-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <input
              type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 cursor-pointer appearance-none rounded-full border-2 border-slate-600 bg-transparent"
              title="색상"
            />
            <div className="h-6 w-px shrink-0 bg-slate-600" />

            {/* 선택 / 그리기 */}
            <Button variant={mode === 'select' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('select')} title="선택" className="shrink-0 px-2">
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button variant={mode === 'draw' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('draw')} title="그리기" className="shrink-0 px-2">
              <Pencil className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px shrink-0 bg-slate-600" />

            {/* 도형 / 텍스트 */}
            <Button variant="secondary" size="sm" onClick={addText} title="텍스트" className="shrink-0 px-2">
              <Type className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={addRect} title="사각형" className="shrink-0 px-2">
              <Square className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={addCircle} title="원" className="shrink-0 px-2">
              <Circle className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px shrink-0 bg-slate-600" />

            {/* 흑백 */}
            <Button
              variant={isGrayscale ? 'default' : 'secondary'}
              size="sm"
              onClick={toggleGrayscale}
              title="흑백"
              className="shrink-0 px-2"
            >
              <Contrast className="h-4 w-4" />
            </Button>

            {/* 모자이크 */}
            <Button
              variant={mode === 'mosaic' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setMode(mode === 'mosaic' ? 'select' : 'mosaic')}
              title="모자이크 (드래그로 영역 지정)"
              className="shrink-0 px-2"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px shrink-0 bg-slate-600" />

            {/* 삭제 */}
            <Button variant="destructive" size="sm" onClick={deleteSelected} title="선택 삭제" className="shrink-0 px-2">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} title="전체 지우기" className="shrink-0 border-red-500/50 bg-slate-800 px-2 text-red-300 hover:bg-red-500 hover:text-white">
              <Eraser className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px shrink-0 bg-slate-600" />

            {/* 회전 / 반전 */}
            <Button variant="secondary" size="sm" onClick={rotate90} title="90도 회전" className="shrink-0 px-2">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={flipH} title="좌우 반전" className="shrink-0 px-2">
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={flipV} title="상하 반전" className="shrink-0 px-2">
              <FlipVertical className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px shrink-0 bg-slate-600" />

            {/* 자르기 */}
            {isCropping ? (
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={applyCrop} disabled={isPending} className="shrink-0 animate-pulse bg-emerald-600 px-2 text-white hover:bg-emerald-700">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '자르기 확정'}
                </Button>
                <Button variant="secondary" size="sm" onClick={cancelCrop} className="shrink-0 px-2">취소</Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={startCrop} title="자르기" className="shrink-0 px-2">
                <Crop className="h-4 w-4" />
              </Button>
            )}

            {/* 모자이크 모드 안내 */}
            {mode === 'mosaic' && (
              <span className="ml-1 text-[11px] text-amber-300 animate-pulse shrink-0">
                드래그로 영역 선택
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 text-white hover:bg-indigo-700">
              {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              저장
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-slate-600 bg-slate-700 px-3 text-white hover:bg-slate-600">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 캔버스 */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzFmMjkzNyI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iIzMzNDE1NSI+PC9jaXJjbGU+Cjwvc3ZnPg==')] p-2">
          <div className="rounded-sm border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <canvas ref={canvasCallbackRef} />
          </div>
        </div>

        {/* 이미지 설명 입력 */}
        <div className="shrink-0 border-t border-slate-700 bg-slate-800 px-4 py-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이미지 설명을 입력하세요 (이미지 하단에 표시됩니다)"
            rows={2}
            className="w-full resize-none rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
