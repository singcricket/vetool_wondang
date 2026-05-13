'use client'

import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { 
  LoaderCircleIcon, PencilIcon, SquareIcon, CircleIcon, 
  TypeIcon, DownloadIcon, MousePointer2Icon, Trash2Icon, TagsIcon, XIcon, SaveIcon,
  RotateCwIcon, FlipHorizontalIcon, FlipVerticalIcon, CropIcon
} from 'lucide-react'
import { 
  getCytologyImageDetails, 
  updateCytologyImageUrl,
  updateCytologyImages,
  deleteCytologyImage
} from '@/lib/actions/cytology/cytology-image-actions'
import { uploadCytologyImage } from '@/lib/services/cytology/upload-cytology-image'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { fabric } from 'fabric'
import CytologyTagSelector from './cytology-image-uploader/cytology-tag-selector'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CytologyImageEditor({ 
  imageId, 
  imageUrl, 
  initialMarks,
  onClose
}: { 
  imageId: string, 
  imageUrl: string, 
  initialMarks?: any | null,
  onClose?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const params = useParams()
  const hosId = params.hos_id as string
  const [color, setColor] = useState('#ef4444')
  const [mode, setMode] = useState<'select' | 'draw'>('select')

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [isTagsLoading, setIsTagsLoading] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchDetails() {
      setIsTagsLoading(true)
      const data = await getCytologyImageDetails(imageId)
      if (data) {
        setTags(data.tags?.split(', ') || [])
      }
      setIsTagsLoading(false)
    }
    fetchDetails()
  }, [imageId])

  const VIRTUAL_SIZE = 1000

  useEffect(() => {
    let isMounted = true
    const containerWidth = window.innerWidth * 0.85
    const containerHeight = window.innerHeight - 150

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      width: containerWidth,
      height: containerHeight,
      selectionColor: 'rgba(139, 92, 246, 0.2)',
      selectionBorderColor: '#8b5cf6',
      selectionLineWidth: 2,
      preserveObjectStacking: true, 
    })
    setFabricCanvas(canvas)

    fabric.Image.fromURL(currentImageUrl, (img) => {
      if (!isMounted) return
      
      // Calculate fit scale for the current canvas
      const canvasAspect = canvas.width! / canvas.height!
      const imgAspect = img.width! / img.height!
      let scaleFactor = canvasAspect >= imgAspect ? canvas.height! / img.height! : canvas.width! / img.width!
      
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

      if (initialMarks) {
        try {
          const parsed = typeof initialMarks === 'string' ? JSON.parse(initialMarks) : initialMarks
          
          // Use a temporary canvas to load at virtual size, then scale objects to current canvas
          const virtualCanvas = new fabric.StaticCanvas(null, { width: VIRTUAL_SIZE, height: VIRTUAL_SIZE })
          virtualCanvas.loadFromJSON(parsed, () => {
            if (!isMounted) return

            const scaleX = canvas.width! / VIRTUAL_SIZE
            const scaleY = canvas.height! / VIRTUAL_SIZE
            const scale = Math.min(scaleX, scaleY)

            // Adjust objects from virtual space to current canvas space
            const objects = virtualCanvas.getObjects()
            objects.forEach((obj: any) => {
              // Calculate relative position in virtual space (centered)
              const relX = obj.left - (VIRTUAL_SIZE / 2)
              const relY = obj.top - (VIRTUAL_SIZE / 2)
              
              // Scale to current canvas space
              obj.set({
                left: (canvas.width! / 2) + (relX * scale),
                top: (canvas.height! / 2) + (relY * scale),
                scaleX: (obj.scaleX || 1) * scale,
                scaleY: (obj.scaleY || 1) * scale
              })
              canvas.add(obj)
            })
            
            if (parsed.bgInfo) {
              img.set({
                angle: parsed.bgInfo.angle || 0,
                flipX: !!parsed.bgInfo.flipX,
                flipY: !!parsed.bgInfo.flipY
              })
              // Recalculate scale after rotation/flip
              const isVertical = (img.angle || 0) === 90 || (img.angle || 0) === 270
              const w = isVertical ? img.height! : img.width!
              const h = isVertical ? img.width! : img.height!
              const newImgAspect = w / h
              const newScaleFactor = canvasAspect >= newImgAspect ? canvas.height! / h : canvas.width! / w
              img.set({ scaleX: newScaleFactor, scaleY: newScaleFactor })
            }

            canvas.renderAll()
            virtualCanvas.dispose()
          })
        } catch(e) {
          console.error('Failed to parse initialMarks', e)
        }
      }
    }, { crossOrigin: 'anonymous' })

    canvas.on('selection:created', () => setMode('select'))
    canvas.on('text:editing:entered', (e: any) => {
      const textarea = canvas.getElement().parentElement?.querySelector('textarea')
      if (textarea) {
        textarea.style.zIndex = '1000'
        textarea.focus()
      }
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const activeObject = canvas.getActiveObject()
      const isEditingText = activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text') && (activeObject as any).isEditing

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
      window.removeEventListener('keydown', handleKeyDown)
      canvas.dispose()
    }
  }, [currentImageUrl, initialMarks])

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
      } else if (activeObj.type === 'path') {
        activeObj.set('stroke', color)
      } else {
        activeObj.set('stroke', color)
      }
      fabricCanvas.requestRenderAll()
    }
  }, [color, fabricCanvas])

  const addText = () => {
    if (!fabricCanvas) return
    const text = new fabric.IText('소견 입력', {
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
      editable: true
    })
    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
    setMode('select')
    setTimeout(() => {
      text.enterEditing()
      text.selectAll()
      const textarea = fabricCanvas.getElement().parentElement?.querySelector('textarea')
      textarea?.focus()
    }, 100)
  }

  const addRect = () => {
    if (!fabricCanvas) return
    const rect = new fabric.Rect({
      left: fabricCanvas.width! / 2, top: fabricCanvas.height! / 2,
      fill: 'transparent', stroke: color, strokeWidth: 4,
      width: 150, height: 100, originX: 'center', originY: 'center',
    })
    fabricCanvas.add(rect)
    fabricCanvas.setActiveObject(rect)
    setMode('select')
  }

  const addCircle = () => {
    if (!fabricCanvas) return
    const circle = new fabric.Circle({
      left: fabricCanvas.width! / 2, top: fabricCanvas.height! / 2,
      fill: 'transparent', stroke: color, strokeWidth: 4,
      radius: 60, originX: 'center', originY: 'center',
    })
    fabricCanvas.add(circle)
    fabricCanvas.setActiveObject(circle)
    setMode('select')
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
    const imgAspect = w / h
    let scaleFactor = canvasAspect >= imgAspect ? fabricCanvas.height! / h : fabricCanvas.width! / w
    bg.set({ scaleX: scaleFactor, scaleY: scaleFactor, left: fabricCanvas.width! / 2, top: fabricCanvas.height! / 2 })
    fabricCanvas.requestRenderAll()
  }

  const startCrop = () => {
    if (!fabricCanvas) return
    setIsCropping(true)
    const rect = new fabric.Rect({
      left: fabricCanvas.width! / 4, top: fabricCanvas.height! / 4,
      width: fabricCanvas.width! / 2, height: fabricCanvas.height! / 2,
      fill: 'rgba(255, 255, 255, 0.3)', stroke: '#fff', strokeWidth: 2, strokeDashArray: [5, 5],
      cornerColor: '#f43f5e', cornerSize: 12, transparentCorners: false, id: 'crop-rect'
    } as any)
    fabricCanvas.add(rect); fabricCanvas.setActiveObject(rect); fabricCanvas.requestRenderAll()
  }

  const applyCrop = async () => {
    if (!fabricCanvas) return
    const cropRect = fabricCanvas.getObjects().find((obj: any) => obj.id === 'crop-rect')
    if (!cropRect) return
    if (!confirm('자르기를 적용하면 마킹이 제거됩니다. 계속하시겠습니까?')) return

    startTransition(async () => {
      try {
        const bound = cropRect.getBoundingRect()
        fabricCanvas.getObjects().forEach((obj: any) => obj.set('visible', false))
        const dataURL = fabricCanvas.toDataURL({
          left: bound.left, top: bound.top, width: bound.width, height: bound.height,
          format: 'jpeg', quality: 0.9, multiplier: 1 / fabricCanvas.getZoom()
        })
        const res = await fetch(dataURL); const blob = await res.blob()
        const detail = await getCytologyImageDetails(imageId)
        const actualChartId = detail?.chart_id || (params.chart_id as string)
        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' })
        const { url, error } = await uploadCytologyImage(file, actualChartId)
        if (error || !url) throw new Error(error || '업로드 실패')
        await updateCytologyImageUrl(imageId, url, hosId)
        setCurrentImageUrl(url); setIsCropping(false)
        toast.success('자르기 완료')
        router.refresh()
      } catch (err) { toast.error('실패'); fabricCanvas.getObjects().forEach((obj: any) => obj.set('visible', true)); fabricCanvas.requestRenderAll() }
    })
  }

  const saveAll = () => {
    if (!fabricCanvas) return
    startTransition(async () => {
      try {
        const cropRect = fabricCanvas.getObjects().find((obj: any) => obj.id === 'crop-rect')
        if (cropRect) fabricCanvas.remove(cropRect)

        // Create a virtual canvas to save the state in a resolution-independent way
        const virtualCanvas = new fabric.StaticCanvas(null, { width: VIRTUAL_SIZE, height: VIRTUAL_SIZE })
        
        const scaleX = fabricCanvas.width! / VIRTUAL_SIZE
        const scaleY = fabricCanvas.height! / VIRTUAL_SIZE
        const scale = Math.min(scaleX, scaleY)

        fabricCanvas.getObjects().forEach((obj: any) => {
          if (obj.id === 'crop-rect') return
          
          const cloned = fabric.util.object.clone(obj)
          const relX = (obj.left - fabricCanvas.width! / 2) / scale
          const relY = (obj.top - fabricCanvas.height! / 2) / scale
          
          cloned.set({
            left: (VIRTUAL_SIZE / 2) + relX,
            top: (VIRTUAL_SIZE / 2) + relY,
            scaleX: obj.scaleX / scale,
            scaleY: obj.scaleY / scale
          })
          virtualCanvas.add(cloned)
        })

        const json = virtualCanvas.toJSON(['id', 'selectable', 'evented', 'angle', 'flipX', 'flipY']) 
        const bgInfo = fabricCanvas.backgroundImage ? {
          angle: fabricCanvas.backgroundImage.angle, flipX: fabricCanvas.backgroundImage.flipX, flipY: fabricCanvas.backgroundImage.flipY,
        } : null
        json.bgInfo = bgInfo
        json.origWidth = VIRTUAL_SIZE
        json.origHeight = VIRTUAL_SIZE
        
        await updateCytologyImages([{
            id: imageId,
            tags: tags.join(', ') || null,
            marks: json
        }], hosId)

        toast.success('저장 완료')
        onClose?.()
        virtualCanvas.dispose()
      } catch(err) { 
        console.error(err)
        toast.error('실패') 
      }
    })
  }

  return (
    <div className="flex flex-col h-full w-full items-center bg-slate-900 overflow-hidden relative" onKeyDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      {/* 툴바 */}
      <div className="w-full flex items-center justify-between p-3 bg-slate-800 shrink-0 border-b border-slate-700 pr-20 z-10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-slate-600 cursor-pointer bg-transparent" />
          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />
          <Button variant={mode === 'select' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('select')}><MousePointer2Icon className="w-4 h-4 mr-1.5" />선택</Button>
          <Button variant={mode === 'draw' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('draw')}><PencilIcon className="w-4 h-4 mr-1.5" />그리기</Button>
          <Button variant="secondary" size="sm" onClick={addText}><TypeIcon className="w-4 h-4 mr-1.5" />글자</Button>
          <Button variant="secondary" size="sm" onClick={addRect}><SquareIcon className="w-4 h-4" /></Button>
          <Button variant="secondary" size="sm" onClick={addCircle}><CircleIcon className="w-4 h-4" /></Button>
          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />
          <Button variant="destructive" size="sm" onClick={() => { fabricCanvas.getActiveObjects().forEach((obj: any) => fabricCanvas.remove(obj)); fabricCanvas.discardActiveObject(); fabricCanvas.requestRenderAll() }}><Trash2Icon className="w-4 h-4 mr-1.5" />지우기</Button>
          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />
          <Button variant="secondary" size="sm" onClick={rotate90}><RotateCwIcon className="w-4 h-4 mr-1.5" />회전</Button>
          <Button variant="secondary" size="sm" onClick={() => { fabricCanvas.backgroundImage.set('flipX', !fabricCanvas.backgroundImage.flipX); fabricCanvas.requestRenderAll() }}><FlipHorizontalIcon className="w-4 h-4 mr-1.5" />좌우</Button>
          <Button variant="secondary" size="sm" onClick={() => { fabricCanvas.backgroundImage.set('flipY', !fabricCanvas.backgroundImage.flipY); fabricCanvas.requestRenderAll() }}><FlipVerticalIcon className="w-4 h-4 mr-1.5" />상하</Button>
          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />
          {isCropping ? (
            <div className="flex gap-1"><Button size="sm" onClick={applyCrop} className="bg-emerald-600 animate-pulse">확정</Button><Button variant="secondary" size="sm" onClick={() => { fabricCanvas.remove(fabricCanvas.getObjects().find((o: any) => o.id === 'crop-rect')); setIsCropping(false) }}>취소</Button></div>
          ) : (
            <Button variant="secondary" size="sm" onClick={startCrop}><CropIcon className="w-4 h-4 mr-1.5" />자르기</Button>
          )}
          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />
          <Button variant={isSidePanelOpen ? "default" : "outline"} size="sm" onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className="text-amber-500 border-amber-500/50 bg-slate-800"><TagsIcon className="w-4 h-4 mr-1.5" />태그</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={saveAll} disabled={isPending} className="bg-rose-600 hover:bg-rose-700 text-white font-bold whitespace-nowrap">
            {isPending ? <LoaderCircleIcon className="animate-spin w-4 h-4 mr-2" /> : <SaveIcon className="w-4 h-4 mr-2" />}저장하기
          </Button>
          {onClose && <Button variant="outline" size="sm" onClick={onClose} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">닫기</Button>}
        </div>
      </div>

      <div className="flex-1 w-full flex overflow-hidden relative">
        <div className="flex-1 h-full flex items-center justify-center p-2 overflow-auto bg-slate-950">
          <div className="shadow-2xl border border-slate-700 bg-black relative rounded-sm">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {isSidePanelOpen && (
          <div className="w-80 h-full bg-white flex flex-col shrink-0 border-l z-30 shadow-2xl">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><TagsIcon className="w-4 h-4" />태그 관리</h3><Button variant="ghost" size="icon" onClick={() => setIsSidePanelOpen(false)}><XIcon className="h-4 w-4" /></Button></div>
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              {isTagsLoading ? <div className="text-center py-10"><LoaderCircleIcon className="w-6 h-6 animate-spin inline mr-2" /></div> : (
                <CytologyTagSelector selectedTags={tags} onTagsChange={setTags} />
              )}
            </div>
            <div className="p-4 border-t bg-slate-50"><Button onClick={saveAll} disabled={isPending} className="w-full font-bold bg-rose-600 hover:bg-rose-700 text-white">모두 저장</Button></div>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>사진 삭제</AlertDialogTitle><AlertDialogDescription>이 사진을 영구 삭제하시겠습니까? 마킹 정보도 함께 삭제됩니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={async () => { await deleteCytologyImage(imageId, imageUrl, hosId); router.refresh(); onClose?.() }} className="bg-red-500">삭제</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  )
}
