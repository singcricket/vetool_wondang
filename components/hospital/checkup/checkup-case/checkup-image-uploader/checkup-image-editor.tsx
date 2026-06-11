'use client'

import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  LoaderCircleIcon,
  PencilIcon,
  SquareIcon,
  CircleIcon,
  EraserIcon,
  TypeIcon,
  DownloadIcon,
  MousePointer2Icon,
  Trash2Icon,
  TagsIcon,
  XIcon,
  RotateCwIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  CropIcon,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { fabric } from 'fabric'
import {
  updateCheckupImageMark,
  updateCheckupImageTags,
  updateCheckupImageUrl,
  deleteCheckupImages,
} from '@/lib/actions/checkup/checkup-image-actions'
import { uploadCheckupImage } from '@/lib/services/checkup/upload-checkup-image'
import CheckupImageTagSelector from './checkup-image-tag-selector'

interface Props {
  imageId: string
  imageUrl: string
  checkupId: string
  initialMark?: Record<string, unknown> | null
  initialTags?: string[]
  initialIsCover?: boolean
  initialMemo?: string | null
  onClose?: () => void
  onSaved?: () => void
}

export default function CheckupImageEditor({
  imageId,
  imageUrl,
  checkupId,
  initialMark,
  initialTags = [],
  initialIsCover = false,
  initialMemo = null,
  onClose,
  onSaved,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [color, setColor] = useState('#ef4444')
  const [mode, setMode] = useState<'select' | 'draw'>('select')
  const [isCropping, setIsCropping] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true)

  // Track fabric text-editing state
  const isTextEditingRef = useRef(false)

  // Tag state
  const [tags, setTags] = useState<string[]>(initialTags)
  const [isCover, setIsCover] = useState(initialIsCover)
  const [memo, setMemo] = useState(initialMemo ?? '')

  // Convert initialMark (Record) to string for fabric
  const initialMarkStr = initialMark ? JSON.stringify(initialMark) : null

  // Fabric canvas init
  useEffect(() => {
    let isMounted = true

    const w = window.innerWidth * 0.92
    const h = window.innerHeight - 100

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      width: w,
      height: h,
      selectionColor: 'rgba(20, 184, 166, 0.2)',
      selectionBorderColor: '#14b8a6',
      selectionLineWidth: 2,
      preserveObjectStacking: true,
    })
    setFabricCanvas(canvas)

    fabric.Image.fromURL(
      currentImageUrl,
      (img) => {
        if (!isMounted) return

        const canvasAspect = canvas.width! / canvas.height!
        const imgAspect = img.width! / img.height!
        let scaleFactor =
          canvasAspect >= imgAspect
            ? canvas.height! / img.height!
            : canvas.width! / img.width!

        img.set({
          originX: 'center',
          originY: 'center',
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          scaleX: scaleFactor,
          scaleY: scaleFactor,
          selectable: false,
          evented: false,
        })

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))

        if (initialMarkStr) {
          try {
            const parsed = JSON.parse(initialMarkStr)
            canvas.loadFromJSON(initialMarkStr, () => {
              if (!isMounted) return

              if (parsed.origWidth && parsed.origHeight) {
                const oldCanvasAspect = parsed.origWidth / parsed.origHeight
                const newCanvasAspect = canvas.width! / canvas.height!

                const isVertical =
                  (parsed.bgInfo?.angle || 0) === 90 ||
                  (parsed.bgInfo?.angle || 0) === 270
                const imgW = isVertical ? img.height! : img.width!
                const imgH = isVertical ? img.width! : img.height!
                const imgAspect = imgW / imgH

                const oldScale =
                  oldCanvasAspect >= imgAspect
                    ? parsed.origHeight / imgH
                    : parsed.origWidth / imgW
                const newScale =
                  newCanvasAspect >= imgAspect
                    ? canvas.height! / imgH
                    : canvas.width! / imgW
                const scaleRatio = newScale / oldScale

                canvas.getObjects().forEach((obj: any) => {
                  const relX = obj.left - parsed.origWidth / 2
                  const relY = obj.top - parsed.origHeight / 2
                  obj.set({
                    left: canvas.width! / 2 + relX * scaleRatio,
                    top: canvas.height! / 2 + relY * scaleRatio,
                    scaleX: (obj.scaleX || 1) * scaleRatio,
                    scaleY: (obj.scaleY || 1) * scaleRatio,
                  })
                  obj.setCoords()
                })
              }

              if (parsed.bgInfo) {
                img.set({
                  angle: parsed.bgInfo.angle || 0,
                  flipX: !!parsed.bgInfo.flipX,
                  flipY: !!parsed.bgInfo.flipY,
                })

                const canvasAspect = canvas.width! / canvas.height!
                const isVertical =
                  (parsed.bgInfo.angle || 0) === 90 ||
                  (parsed.bgInfo.angle || 0) === 270
                const w = isVertical ? img.height! : img.width!
                const h = isVertical ? img.width! : img.height!
                const imgAspect = w / h
                const scaleFactor =
                  canvasAspect >= imgAspect
                    ? canvas.height! / h
                    : canvas.width! / w
                img.set({
                  scaleX: scaleFactor,
                  scaleY: scaleFactor,
                  left: canvas.width! / 2,
                  top: canvas.height! / 2,
                })
              }

              canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
              canvas.requestRenderAll()
            })
          } catch (e) {
            console.error('Failed to parse initialMark', e)
          }
        }
      },
      { crossOrigin: 'anonymous' },
    )

    canvas.on('selection:created', () => setMode('select'))

    canvas.on('text:editing:entered', () => {
      isTextEditingRef.current = true
      const refocus = () => {
        const textarea = canvas.getElement().parentElement?.querySelector('textarea')
        if (textarea) {
          textarea.style.zIndex = '1000'
          textarea.focus()
        }
      }
      refocus()
      setTimeout(refocus, 50)
      setTimeout(refocus, 150)
    })

    canvas.on('text:editing:exited', () => {
      isTextEditingRef.current = false
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      const activeObject = canvas.getActiveObject()
      const isEditingText =
        activeObject &&
        (activeObject.type === 'i-text' || activeObject.type === 'text') &&
        (activeObject as any).isEditing

      if (!isEditingText) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeObjects = canvas.getActiveObjects()
          if (activeObjects.length) {
            activeObjects.forEach((obj: any) => canvas.remove(obj))
            canvas.discardActiveObject()
            canvas.requestRenderAll()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      isMounted = false
      isTextEditingRef.current = false
      window.removeEventListener('keydown', handleKeyDown)
      canvas.dispose()
    }
  }, [currentImageUrl, initialMarkStr])

  useEffect(() => {
    if (!fabricCanvas) return
    fabricCanvas.isDrawingMode = mode === 'draw'
    if (mode === 'draw') {
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas)
      fabricCanvas.freeDrawingBrush.color = color
      fabricCanvas.freeDrawingBrush.width = 4
    }
    if (mode !== 'select') {
      fabricCanvas.discardActiveObject()
      fabricCanvas.requestRenderAll()
    }
  }, [mode, fabricCanvas, color])

  useEffect(() => {
    if (!fabricCanvas) return
    const activeObj = fabricCanvas.getActiveObject()
    if (activeObj) {
      if (activeObj.type === 'i-text' || activeObj.type === 'text') {
        activeObj.set('fill', color)
      } else {
        activeObj.set('stroke', color)
      }
      fabricCanvas.requestRenderAll()
    }
  }, [color, fabricCanvas])

  const addText = () => {
    if (!fabricCanvas) return
    const text = new fabric.IText('텍스트 입력', {
      left: fabricCanvas.width! / 2,
      top: fabricCanvas.height! / 2,
      fill: color,
      fontSize: 32,
      fontFamily: 'sans-serif',
      originX: 'center',
      originY: 'center',
      strokeWidth: 0,
      fontWeight: 'bold',
      padding: 10,
      editable: true,
    })
    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
    setMode('select')
    const doEnterEdit = () => {
      text.enterEditing()
      text.selectAll()
      const textarea = fabricCanvas.getElement().parentElement?.querySelector('textarea')
      if (textarea) {
        textarea.style.zIndex = '1000'
        textarea.focus()
      }
    }
    setTimeout(doEnterEdit, 100)
    setTimeout(() => {
      const textarea = fabricCanvas.getElement().parentElement?.querySelector('textarea')
      textarea?.focus()
    }, 200)
  }

  const addRect = () => {
    if (!fabricCanvas) return
    const rect = new fabric.Rect({
      left: fabricCanvas.width! / 2,
      top: fabricCanvas.height! / 2,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 4,
      width: 150,
      height: 100,
      originX: 'center',
      originY: 'center',
    })
    fabricCanvas.add(rect)
    fabricCanvas.setActiveObject(rect)
    setMode('select')
  }

  const addCircle = () => {
    if (!fabricCanvas) return
    const circle = new fabric.Circle({
      left: fabricCanvas.width! / 2,
      top: fabricCanvas.height! / 2,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 4,
      radius: 60,
      originX: 'center',
      originY: 'center',
    })
    fabricCanvas.add(circle)
    fabricCanvas.setActiveObject(circle)
    setMode('select')
  }

  const deleteSelected = () => {
    if (!fabricCanvas) return
    const activeObjects = fabricCanvas.getActiveObjects()
    if (activeObjects.length) {
      activeObjects.forEach((obj: any) => fabricCanvas.remove(obj))
      fabricCanvas.discardActiveObject()
      fabricCanvas.requestRenderAll()
    }
  }

  const clearAll = () => {
    if (!fabricCanvas) return
    if (!confirm('모든 그림 및 글자를 지우시겠습니까?')) return
    fabricCanvas.clear()
    fabric.Image.fromURL(
      currentImageUrl,
      (img) => {
        const canvasAspect = fabricCanvas.width! / fabricCanvas.height!
        const imgAspect = img.width! / img.height!
        const scaleFactor =
          canvasAspect >= imgAspect
            ? fabricCanvas.height! / img.height!
            : fabricCanvas.width! / img.width!
        img.set({
          originX: 'center',
          originY: 'center',
          left: fabricCanvas.width! / 2,
          top: fabricCanvas.height! / 2,
          scaleX: scaleFactor,
          scaleY: scaleFactor,
          selectable: false,
          evented: false,
        })
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas))
      },
      { crossOrigin: 'anonymous' },
    )
  }

  const rotate90 = () => {
    if (!fabricCanvas) return
    const bg = fabricCanvas.backgroundImage
    if (!bg) return
    const newAngle = ((bg.angle || 0) + 90) % 360
    bg.set('angle', newAngle)
    const canvasAspect = fabricCanvas.width! / fabricCanvas.height!
    const isVertical = newAngle === 90 || newAngle === 270
    const w = isVertical ? bg.height! : bg.width!
    const h = isVertical ? bg.width! : bg.height!
    const scaleFactor =
      canvasAspect >= w / h ? fabricCanvas.height! / h : fabricCanvas.width! / w
    bg.set({ scaleX: scaleFactor, scaleY: scaleFactor, left: fabricCanvas.width! / 2, top: fabricCanvas.height! / 2 })
    fabricCanvas.requestRenderAll()
  }

  const flipH = () => {
    if (!fabricCanvas?.backgroundImage) return
    fabricCanvas.backgroundImage.set('flipX', !fabricCanvas.backgroundImage.flipX)
    fabricCanvas.requestRenderAll()
  }

  const flipV = () => {
    if (!fabricCanvas?.backgroundImage) return
    fabricCanvas.backgroundImage.set('flipY', !fabricCanvas.backgroundImage.flipY)
    fabricCanvas.requestRenderAll()
  }

  const startCrop = () => {
    if (!fabricCanvas) return
    setIsCropping(true)
    setMode('select')
    const rect = new fabric.Rect({
      left: fabricCanvas.width! / 4,
      top: fabricCanvas.height! / 4,
      width: fabricCanvas.width! / 2,
      height: fabricCanvas.height! / 2,
      fill: 'rgba(255, 255, 255, 0.3)',
      stroke: '#fff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: '#14b8a6',
      cornerSize: 12,
      transparentCorners: false,
      id: 'crop-rect',
    } as any)
    fabricCanvas.add(rect)
    fabricCanvas.setActiveObject(rect)
    fabricCanvas.requestRenderAll()
  }

  const cancelCrop = () => {
    if (!fabricCanvas) return
    const cropRect = fabricCanvas.getObjects().find((obj: any) => obj.id === 'crop-rect')
    if (cropRect) fabricCanvas.remove(cropRect)
    setIsCropping(false)
    fabricCanvas.requestRenderAll()
  }

  const applyCrop = () => {
    if (!fabricCanvas) return
    const cropRect = fabricCanvas.getObjects().find((obj: any) => obj.id === 'crop-rect')
    if (!cropRect) return
    if (!confirm('이미지를 자르면 현재 마킹이 제거됩니다. 계속하시겠습니까?')) return

    startTransition(async () => {
      try {
        const bound = cropRect.getBoundingRect()
        fabricCanvas.getObjects().forEach((obj: any) => {
          if (obj.id !== 'crop-rect') obj.set('visible', false)
        })
        ;(cropRect as any).set('visible', false)

        const dataURL = fabricCanvas.toDataURL({
          left: bound.left,
          top: bound.top,
          width: bound.width,
          height: bound.height,
          format: 'jpeg',
          quality: 0.9,
          multiplier: 1 / fabricCanvas.getZoom(),
        })

        const res = await fetch(dataURL)
        const blob = await res.blob()
        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' })
        const uploadRes = await uploadCheckupImage(file, checkupId)

        if (uploadRes.error || !uploadRes.url) throw new Error(uploadRes.error || '업로드 실패')

        await updateCheckupImageUrl(imageId, uploadRes.url)
        setCurrentImageUrl(uploadRes.url)
        setIsCropping(false)
        toast.success('이미지가 잘렸습니다.')
      } catch (err: any) {
        toast.error('자르기에 실패했습니다.')
        fabricCanvas.getObjects().forEach((obj: any) => obj.set('visible', true))
        fabricCanvas.requestRenderAll()
      }
    })
  }

  const handleDeleteImage = () => {
    if (!confirm('이 이미지를 삭제하시겠습니까? 되돌릴 수 없습니다.')) return
    startTransition(async () => {
      try {
        await deleteCheckupImages([imageId])
        toast.success('이미지가 삭제되었습니다.')
        onSaved?.()
        onClose?.()
      } catch {
        toast.error('이미지 삭제에 실패했습니다.')
      }
    })
  }

  const saveMark = () => {
    if (!fabricCanvas) return
    startTransition(async () => {
      try {
        const cropRect = fabricCanvas.getObjects().find((obj: any) => obj.id === 'crop-rect')
        if (cropRect) fabricCanvas.remove(cropRect)

        const json = fabricCanvas.toJSON(['id', 'selectable', 'evented', 'angle', 'flipX', 'flipY'])
        const bgInfo = fabricCanvas.backgroundImage
          ? {
              angle: fabricCanvas.backgroundImage.angle,
              flipX: fabricCanvas.backgroundImage.flipX,
              flipY: fabricCanvas.backgroundImage.flipY,
            }
          : null
        delete json.backgroundImage
        json.bgInfo = bgInfo
        json.origWidth = fabricCanvas.width
        json.origHeight = fabricCanvas.height

        await updateCheckupImageMark(imageId, JSON.stringify(json))
        await updateCheckupImageTags(imageId, tags, isCover, memo || null)

        toast.success('저장되었습니다.')
        onSaved?.()
        onClose?.()
      } catch (err) {
        toast.error('저장에 실패했습니다.')
        console.error(err)
      }
    })
  }

  return (
    <div
      className="flex flex-col h-full w-full items-center bg-slate-900 overflow-hidden relative"
      onKeyDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toolbar */}
      <div
        className="w-full flex items-center justify-between p-3 bg-slate-800 shrink-0 shadow-lg z-10 border-b border-slate-700 pr-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {/* Color picker */}
          <div className="relative flex items-center ml-1 shrink-0">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-2 border-slate-600 outline-none p-0 appearance-none bg-transparent"
              title="색상 변경"
            />
          </div>
          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          <Button
            variant={mode === 'select' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setMode('select')}
            className="px-2 shrink-0"
          >
            <MousePointer2Icon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">선택</span>
          </Button>
          <Button
            variant={mode === 'draw' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setMode('draw')}
            className="px-2 shrink-0"
          >
            <PencilIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">그리기</span>
          </Button>

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          <Button variant="secondary" size="sm" onClick={addText} className="px-2 shrink-0">
            <TypeIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">글자</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={addRect} className="px-2 shrink-0">
            <SquareIcon className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={addCircle} className="px-2 shrink-0">
            <CircleIcon className="w-4 h-4" />
          </Button>

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          <Button variant="destructive" size="sm" onClick={deleteSelected} className="px-2 shrink-0">
            <Trash2Icon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">선택 삭제</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="px-2 shrink-0 text-red-300 border-red-500/50 hover:bg-red-500 hover:text-white bg-slate-800"
          >
            <EraserIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">전체 삭제</span>
          </Button>

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          <Button variant="secondary" size="sm" onClick={rotate90} className="px-2 shrink-0">
            <RotateCwIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">회전</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={flipH} className="px-2 shrink-0">
            <FlipHorizontalIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">좌우</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={flipV} className="px-2 shrink-0">
            <FlipVerticalIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">상하</span>
          </Button>

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          {isCropping ? (
            <div className="flex items-center gap-1">
              <Button
                variant="default"
                size="sm"
                onClick={applyCrop}
                className="bg-emerald-600 hover:bg-emerald-700 animate-pulse text-white px-2 shrink-0"
              >
                자르기 확정
              </Button>
              <Button variant="secondary" size="sm" onClick={cancelCrop} className="px-2 shrink-0">
                취소
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={startCrop} className="px-2 shrink-0">
              <CropIcon className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-xs">자르기</span>
            </Button>
          )}

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          <Button
            variant={isSidePanelOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="px-2 shrink-0 text-amber-500 border-amber-500/50 hover:bg-amber-500 hover:text-white bg-slate-800"
          >
            <TagsIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">태그</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Button
            onClick={saveMark}
            disabled={isPending}
            className="font-bold whitespace-nowrap bg-teal-600 hover:bg-teal-700 text-white shadow-md"
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin w-4 h-4 sm:mr-2" />
            ) : (
              <DownloadIcon className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">저장하기</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteImage}
            disabled={isPending}
            className="border-red-500/60 bg-slate-800 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 px-3 shrink-0"
          >
            <Trash2Icon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">이미지 삭제</span>
          </Button>
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 px-3"
            >
              닫기
            </Button>
          )}
        </div>
      </div>

      {/* Canvas + side panel */}
      <div className="flex-1 w-full flex flex-row overflow-hidden relative">
        <div className="flex-1 h-full flex items-center justify-center p-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iIzMzNDE1NSI+PC9jaXJjbGU+Cjwvc3ZnPg==')] overflow-auto">
          <div className="shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-slate-700 bg-black relative rounded-sm outline-none">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {isSidePanelOpen && (
          <div className="w-72 h-full bg-white flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.2)] z-30 border-l border-slate-300">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TagsIcon className="w-4 h-4 text-slate-500" /> 태그 관리
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidePanelOpen(false)}
                className="h-8 w-8 text-slate-500 hover:text-slate-800"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600">사진 설명 (메모)</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={4}
                  placeholder="사진에 대한 설명을 입력하세요..."
                  className="w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  표지 / 대표사진
                </Label>
                <Switch checked={isCover} onCheckedChange={setIsCover} />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">태그 선택</p>
                <CheckupImageTagSelector selectedTags={tags} onChange={setTags} />
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 shrink-0">
              <Button
                onClick={saveMark}
                disabled={isPending}
                className="w-full font-bold bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isPending ? (
                  <LoaderCircleIcon className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <DownloadIcon className="w-4 h-4 mr-2" />
                )}
                마킹 + 태그 저장
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
