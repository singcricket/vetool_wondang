'use client'

import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { 
  LoaderCircleIcon, PencilIcon, SquareIcon, CircleIcon, 
  EraserIcon, TypeIcon, DownloadIcon, MousePointer2Icon, Trash2Icon 
} from 'lucide-react'
import { updateDentalImageMark } from '@/lib/actions/dental/update-dental-image-mark'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { fabric } from 'fabric'

export default function DentalImageEditor({ 
  imageId, 
  imageUrl, 
  initialMark,
  onClose
}: { 
  imageId: string, 
  imageUrl: string, 
  initialMark?: string | null,
  onClose?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const params = useParams()
  const hosId = params.hos_id as string
  const [color, setColor] = useState('#ef4444') // 기본 빨간색
  const [mode, setMode] = useState<'select' | 'draw'>('select')

  // Fabric 인스턴스 초기화
  useEffect(() => {
    let isMounted = true
    
    // PC에서 더 크게 보이기 위해 여백 최소화 (뷰포트 95%)
    const w = window.innerWidth * 0.92;
    const h = (window.innerHeight - 100); // 툴바 제외 높이

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      width: w,
      height: h,
      selectionColor: 'rgba(99, 102, 241, 0.2)',
      selectionBorderColor: '#6366f1',
      selectionLineWidth: 2,
      preserveObjectStacking: true, 
    })
    setFabricCanvas(canvas)

    // 백그라운드 이미지 스케일 조정
    fabric.Image.fromURL(imageUrl, (img) => {
      if (!isMounted) return
      
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

      if (initialMark) {
        try {
          canvas.loadFromJSON(initialMark, () => {
             if (!isMounted) return
             canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
             canvas.requestRenderAll()
          })
        } catch(e) {
          console.error('Failed to parse initialMark', e)
        }
      }
    }, { crossOrigin: 'anonymous' })

    // 객체 선택 시 모드 자동 변경 및 편집 편의성
    canvas.on('selection:created', () => {
      setMode('select')
    })

    // Radix Dialog 내에서 텍스트 편집기 포커스 문제 해결
    canvas.on('text:editing:entered', (e: any) => {
      const textarea = canvas.getElement().parentElement?.querySelector('textarea')
      if (textarea) {
        textarea.style.zIndex = '1000'
        textarea.focus()
      }
    })

    // 키보드 이벤트 (Delete 등) 처리
    const handleKeyDown = (e: KeyboardEvent) => {
      // 텍스트 편집 중이 아닐 때만 작동하도록 체크
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
  }, [imageUrl, initialMark])

  // 도구 및 색상 변경 Effect
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
  
  // 색상이 변경되면, 선택된 객체(Text, 도형 등)의 색상도 즉시 적용
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
      editable: true
    })
    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
    setMode('select')
    
    // 포커스 지연 처리 (텍스트 생성 직후 렌더링 동기화)
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
    if (confirm('모든 그림 및 글자를 지우시겠습니까?')) {
      fabricCanvas.clear()
      fabric.Image.fromURL(imageUrl, (img) => {
        const canvasAspect = fabricCanvas.width! / fabricCanvas.height!
        const imgAspect = img.width! / img.height!
        let scaleFactor = canvasAspect >= imgAspect ? fabricCanvas.height! / img.height! : fabricCanvas.width! / img.width!
        img.set({ originX: 'center', originY: 'center', left: fabricCanvas.width! / 2, top: fabricCanvas.height! / 2, scaleX: scaleFactor, scaleY: scaleFactor, selectable: false, evented: false })
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas))
      }, { crossOrigin: 'anonymous' })
    }
  }

  const saveMark = () => {
    if (!fabricCanvas) return
    startTransition(async () => {
      try {
        const json = fabricCanvas.toJSON(['id', 'selectable', 'evented']) 
        delete json.backgroundImage
        const stringified = JSON.stringify(json)
        await updateDentalImageMark(imageId, stringified, hosId)
        toast.success('태그 마킹이 보존/저장되었습니다.')
      } catch(err) {
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
      {/* 상단 툴바 */}
      <div 
        className="w-full flex items-center justify-between p-3 bg-slate-800 shrink-0 shadow-lg z-10 border-b border-slate-700 pr-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1">
          {/* 색상 선택 */}
          <div className="relative group flex items-center ml-1 shrink-0">
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-2 border-slate-600 outline-none p-0 appearance-none bg-transparent"
              title="색상 변경" 
            />
          </div>
          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />
          
          <Button variant={mode === 'select' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('select')} title="조작/선택 (단축키: V)" className="px-2 shrink-0">
            <MousePointer2Icon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">선택</span>
          </Button>
          <Button variant={mode === 'draw' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('draw')} title="직접 그리기 (브러쉬)" className="px-2 shrink-0">
            <PencilIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">그리기</span>
          </Button>
          
          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />
          
          <Button variant="secondary" size="sm" onClick={addText} title="텍스트 상자 추가" className="px-2 shrink-0">
            <TypeIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">글자 추가</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={addRect} title="사각형 추가" className="px-2 shrink-0">
            <SquareIcon className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={addCircle} title="동그라미 추가" className="px-2 shrink-0">
            <CircleIcon className="w-4 h-4" />
          </Button>

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          <Button variant="destructive" size="sm" onClick={deleteSelected} title="선택된 객체 지우기" className="px-2 shrink-0">
            <Trash2Icon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">선택 삭제</span>
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} title="모두 지우기 (초기화)" className="px-2 shrink-0 text-red-300 border-red-500/50 hover:bg-red-500 hover:text-white bg-slate-800">
            <EraserIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">전체 삭제</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={saveMark} disabled={isPending} className="font-bold whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            {isPending ? <LoaderCircleIcon className="animate-spin w-4 h-4 sm:mr-2" /> : <DownloadIcon className="w-4 h-4 sm:mr-2" />}
            <span className="hidden sm:inline">저장하기</span>
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 px-3">
              닫기
            </Button>
          )}
        </div>
      </div>

      {/* 중앙 캔버스 워크스페이스 */}
      <div className="flex-1 w-full flex items-center justify-center p-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iIzMzNDE1NSI+PC9jaXJjbGU+Cjwvc3ZnPg==')] overflow-auto">
        <div className="shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-slate-700 bg-black relative rounded-sm outline-none">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}
