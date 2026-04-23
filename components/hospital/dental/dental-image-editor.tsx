'use client'

import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { 
  LoaderCircleIcon, PencilIcon, SquareIcon, CircleIcon, 
  EraserIcon, TypeIcon, DownloadIcon, MousePointer2Icon, Trash2Icon, TagsIcon, XIcon, SaveIcon,
  RotateCwIcon, FlipHorizontalIcon, FlipVerticalIcon, CropIcon
} from 'lucide-react'
import { updateDentalImageMark } from '@/lib/actions/dental/update-dental-image-mark'
import { updateDentalImageTagsById } from '@/lib/actions/dental/update-dental-image-tags-by-id'
import { updateDentalImageUrl } from '@/lib/actions/dental/update-dental-image-url'
import { getDentalImageDetails } from '@/lib/actions/dental/get-dental-image-details'
import { uploadDentalImage } from '@/lib/services/dental/upload-dental-image'
import { deleteDentalImages } from '@/lib/actions/dental/delete-dental-images'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { fabric } from 'fabric'
import DentalToothSelector from './dental-image-uploader/dental-tooth-selector'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

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

  // ==== 태그 및 메타데이터 상태 ====
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [species, setSpecies] = useState('canine')
  const [toothIds, setToothIds] = useState<string[]>([])
  const [otherTags, setOtherTags] = useState<string[]>([])
  const [isRadio, setIsRadio] = useState(false)
  const [isTagsLoading, setIsTagsLoading] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl)
  const router = useRouter()

  // 에디터 진입 시 이미지의 태그 메타데이터 호출
  useEffect(() => {
    async function fetchDetails() {
      setIsTagsLoading(true)
      const data = await getDentalImageDetails(imageId)
      if (data) {
        setSpecies(data.species)
        setToothIds(data.tooth_ids)
        setOtherTags(data.other_tags)
        setIsRadio(data.is_radio)
      }
      setIsTagsLoading(false)
    }
    fetchDetails()
  }, [imageId])

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

    // 백그라운드 이미지 스케일 조정 (currentImageUrl 사용)
    fabric.Image.fromURL(currentImageUrl, (img) => {
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
          const parsed = JSON.parse(initialMark)
          canvas.loadFromJSON(initialMark, () => {
             if (!isMounted) return
             
             // ── 해상도 차이에 따른 마킹 스케일 보정 로직 ──
             if (parsed.origWidth && parsed.origHeight) {
                const ratioX = canvas.width! / parsed.origWidth
                const ratioY = canvas.height! / parsed.origHeight
                
                // 이미지가 aspect-fit으로 중앙 정렬되므로, 
                // 이미지의 실제 스케일 변화량을 추적하는 것이 가장 정확함
                const oldCanvasAspect = parsed.origWidth / parsed.origHeight
                const newCanvasAspect = canvas.width! / canvas.height!
                
                const isVertical = (parsed.bgInfo?.angle || 0) === 90 || (parsed.bgInfo?.angle || 0) === 270
                const imgW = isVertical ? img.height! : img.width!
                const imgH = isVertical ? img.width! : img.height!
                const imgAspect = imgW / imgH

                const oldScale = oldCanvasAspect >= imgAspect ? parsed.origHeight / imgH : parsed.origWidth / imgW
                const newScale = newCanvasAspect >= imgAspect ? canvas.height! / imgH : canvas.width! / imgW
                const scaleRatio = newScale / oldScale

                canvas.getObjects().forEach((obj: any) => {
                  // 1. 위치 보정 (중앙 기준 상대 좌표로 변환 후 스케일링)
                  const relX = obj.left - (parsed.origWidth / 2)
                  const relY = obj.top - (parsed.origHeight / 2)
                  
                  obj.set({
                    left: (canvas.width! / 2) + (relX * scaleRatio),
                    top: (canvas.height! / 2) + (relY * scaleRatio),
                    // 2. 크기 보정
                    scaleX: (obj.scaleX || 1) * scaleRatio,
                    scaleY: (obj.scaleY || 1) * scaleRatio
                  })
                  obj.setCoords()
                })
             }

             // 복원된 배경 이미지 설정 (각도, 반전 등 적용)
             if (parsed.bgInfo) {
                img.set({
                  angle: parsed.bgInfo.angle || 0,
                  flipX: !!parsed.bgInfo.flipX,
                  flipY: !!parsed.bgInfo.flipY
                })
                
                // 다시 정렬
                const canvasAspect = canvas.width! / canvas.height!
                const isVertical = (parsed.bgInfo.angle || 0) === 90 || (parsed.bgInfo.angle || 0) === 270
                const w = isVertical ? img.height! : img.width!
                const h = isVertical ? img.width! : img.height!
                const imgAspect = w / h
                let scaleFactor = canvasAspect >= imgAspect ? canvas.height! / h : canvas.width! / w
                
                img.set({
                  scaleX: scaleFactor,
                  scaleY: scaleFactor,
                  left: canvas.width! / 2,
                  top: canvas.height! / 2
                })
             }

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
      // 입력창 등에서는 동작 방지
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

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
  }, [currentImageUrl, initialMark])

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
      fabric.Image.fromURL(currentImageUrl, (img) => {
        const canvasAspect = fabricCanvas.width! / fabricCanvas.height!
        const imgAspect = img.width! / img.height!
        let scaleFactor = canvasAspect >= imgAspect ? fabricCanvas.height! / img.height! : fabricCanvas.width! / img.width!
        img.set({ originX: 'center', originY: 'center', left: fabricCanvas.width! / 2, top: fabricCanvas.height! / 2, scaleX: scaleFactor, scaleY: scaleFactor, selectable: false, evented: false })
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas))
      }, { crossOrigin: 'anonymous' })
    }
  }

  const rotate90 = () => {
    if (!fabricCanvas) return
    const bg = fabricCanvas.backgroundImage
    if (!bg) return
    
    // 현재 각도에서 90도씩 회전
    const currentAngle = bg.angle || 0
    const newAngle = (currentAngle + 90) % 360
    bg.set('angle', newAngle)
    
    // 회전 후 캔버스 중앙에 맞추기 위해 정렬 다시 계산
    const canvasAspect = fabricCanvas.width! / fabricCanvas.height!
    // 회전되었을 때는 원본의 너비/높이를 바꿔서 계산해야 함
    const isVertical = newAngle === 90 || newAngle === 270
    const w = isVertical ? bg.height! : bg.width!
    const h = isVertical ? bg.width! : bg.height!
    const imgAspect = w / h
    
    let scaleFactor = canvasAspect >= imgAspect ? fabricCanvas.height! / h : fabricCanvas.width! / w
    
    bg.set({
      scaleX: scaleFactor,
      scaleY: scaleFactor,
      left: fabricCanvas.width! / 2,
      top: fabricCanvas.height! / 2
    })
    
    fabricCanvas.requestRenderAll()
  }

  const flipH = () => {
    if (!fabricCanvas) return
    const bg = fabricCanvas.backgroundImage
    if (!bg) return
    bg.set('flipX', !bg.flipX)
    fabricCanvas.requestRenderAll()
  }

  const flipV = () => {
    if (!fabricCanvas) return
    const bg = fabricCanvas.backgroundImage
    if (!bg) return
    bg.set('flipY', !bg.flipY)
    fabricCanvas.requestRenderAll()
  }

  const startCrop = () => {
    if (!fabricCanvas) return
    setIsCropping(true)
    setMode('select')
    
    // 자르기 영역을 나타낼 사각형 추가
    const rect = new fabric.Rect({
      left: fabricCanvas.width! / 4,
      top: fabricCanvas.height! / 4,
      width: fabricCanvas.width! / 2,
      height: fabricCanvas.height! / 2,
      fill: 'rgba(255, 255, 255, 0.3)',
      stroke: '#fff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: '#6366f1',
      cornerSize: 12,
      transparentCorners: false,
      id: 'crop-rect'
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

  const applyCrop = async () => {
    if (!fabricCanvas) return
    const cropRect = fabricCanvas.getObjects().find((obj: any) => obj.id === 'crop-rect')
    if (!cropRect) return

    if (!confirm('이미지를 자르면 현재 그려진 모든 마킹이 제거됩니다. 계속하시겠습니까?')) return

    startTransition(async () => {
      try {
        // 1. 자를 영역 계산
        const bound = cropRect.getBoundingRect()
        
        // 2. 배경 이미지만 남기고 모든 객체 숨기기 (캡처를 위해)
        const objects = fabricCanvas.getObjects()
        objects.forEach((obj: any) => {
          if ((obj as any).id !== 'crop-rect') obj.set('visible', false)
        })
        ;(cropRect as any).set('visible', false) // 자기 자신도 숨김

        // 3. 캡처
        const dataURL = fabricCanvas.toDataURL({
          left: bound.left,
          top: bound.top,
          width: bound.width,
          height: bound.height,
          format: 'jpeg',
          quality: 0.9,
          multiplier: 1 / fabricCanvas.getZoom() // 현재 줌 무시하고 실제 크기 기준으로 캡처하려면 조정 필요할 수 있음
        })

        // 4. Blob으로 변환하여 업로드
        const res = await fetch(dataURL)
        const blob = await res.blob()
        const chartId = params.target_date // 차트 ID 대용 또는 상세 조회에서 가져온 ID 사용
        // 실제 chart_id를 찾기 위해 imgData가 필요하지만, params에서 유추하거나 getDetails에서 가져온 것을 활용
        // 여기서는 안전하게 params 구조 혹은 에디터 진입 시의 chartId를 활용해야 함.
        // 현재 DentalImageEditor에는 chartId가 명시적으로 없으므로 getDetails에서 가져오거나 chart_id를 prop으로 받아야 함.
        
        // getDentalImageDetails에서 chart_id를 가져오도록 수정하거나, params에서 id 추출
        // url을 생성하기 위해 chartId가 필수임.
        const detail = await getDentalImageDetails(imageId)
        const actualChartId = detail?.chart_id || (params.dental_id as string)

        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' })
        const uploadRes = await uploadDentalImage(file, actualChartId)

        if (uploadRes.error || !uploadRes.url) throw new Error(uploadRes.error || '업로드 실패')

        // 5. DB 업데이트 및 상태 갱신
        await updateDentalImageUrl(imageId, uploadRes.url, hosId)
        
        // 6. 상태 초기화 (setCurrentImageUrl 변경 시 useEffect가 실행되어 캔버스를 새로 고침)
        setCurrentImageUrl(uploadRes.url)
        setIsCropping(false)
        
        toast.success('이미지가 성공적으로 잘렸습니다.')
        router.refresh()
      } catch (err: any) {
        toast.error('자르기에 실패했습니다.')
        console.error(err)
        // 실패 시 객체 다시 보이기
        fabricCanvas.getObjects().forEach((obj: any) => obj.set('visible', true))
        fabricCanvas.requestRenderAll()
      }
    })
  }

  const saveMarkAndTags = () => {
    if (!fabricCanvas) return
    startTransition(async () => {
      try {
        // 자르기 사각형이 남아있다면 제거하고 저장
        const cropRect = fabricCanvas.getObjects().find((obj: any) => obj.id === 'crop-rect')
        if (cropRect) fabricCanvas.remove(cropRect)

        // 객체들과 함께 배경 정보(각도, 반전 등)를 포함하여 저장
        const json = fabricCanvas.toJSON(['id', 'selectable', 'evented', 'angle', 'flipX', 'flipY']) 
        
        // 배경 이미지의 URL 정보 자체는 DB 공간 절약을 위해 제외하되, 
        // 각도와 반전 상태는 나중에 로드 시 복원하기 위해 따로 저장하거나 JSON에 남겨둠
        const bgInfo = fabricCanvas.backgroundImage ? {
          angle: fabricCanvas.backgroundImage.angle,
          flipX: fabricCanvas.backgroundImage.flipX,
          flipY: fabricCanvas.backgroundImage.flipY,
        } : null

        delete json.backgroundImage
        json.bgInfo = bgInfo // 커스텀 정보 추가
        
        // 저장 시의 캔버스 크기를 함께 기록하여 리포트 출력 시 비율을 맞출 수 있게 함
        json.origWidth = fabricCanvas.width
        json.origHeight = fabricCanvas.height
        const stringified = JSON.stringify(json)
        
        // 1. 마킹 좌표 저장 (JSON 내부에 bgInfo 포함됨)
        await updateDentalImageMark(imageId, stringified, hosId)
        
        // 2. 태그 및 속성 저장
        await updateDentalImageTagsById(imageId, toothIds, isRadio, otherTags, hosId)
        
        toast.success('태그 및 마킹 정보가 완전히 보존되었습니다.')
      } catch(err) {
        toast.error('저장에 실패했습니다.')
        console.error(err)
      }
    })
  }
  
  const handleDeleteImage = async () => {
    if (!confirm('이 사진을 완전히 삭제하시겠습니까? 관련 데이터와 마킹도 모두 사라집니다.')) return

    startTransition(async () => {
      try {
        await deleteDentalImages([imageId], hosId)
        toast.success('사진이 삭제되었습니다.')
        router.refresh()
        onClose?.()
      } catch (err) {
        console.error(err)
        toast.error('사진 삭제에 실패했습니다.')
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

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          <Button variant="secondary" size="sm" onClick={rotate90} title="90도 회전" className="px-2 shrink-0">
            <RotateCwIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">회전</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={flipH} title="좌우 반전" className="px-2 shrink-0">
            <FlipHorizontalIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">좌우</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={flipV} title="상하 반전" className="px-2 shrink-0">
            <FlipVerticalIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">상하</span>
          </Button>

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          {isCropping ? (
            <div className="flex items-center gap-1">
              <Button variant="default" size="sm" onClick={applyCrop} className="bg-emerald-600 hover:bg-emerald-700 animate-pulse text-white px-2 shrink-0">
                자르기 확정
              </Button>
              <Button variant="secondary" size="sm" onClick={cancelCrop} className="px-2 shrink-0">
                취소
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={startCrop} title="이미지 자르기" className="px-2 shrink-0">
              <CropIcon className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-xs">자르기</span>
            </Button>
          )}

          <div className="w-[1px] h-6 bg-slate-600 mx-1 shrink-0" />

          <Button 
            variant={isSidePanelOpen ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
            title="태그 속성 편집" 
            className="px-2 shrink-0 text-amber-500 border-amber-500/50 hover:bg-amber-500 hover:text-white bg-slate-800"
          >
            <TagsIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">태그 관리</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={saveMarkAndTags} disabled={isPending} className="font-bold whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            {isPending ? <LoaderCircleIcon className="animate-spin w-4 h-4 sm:mr-2" /> : <DownloadIcon className="w-4 h-4 sm:mr-2" />}
            <span className="hidden sm:inline">저장하기</span>
          </Button>

          {/* 사진 자체 삭제 버튼 (마킹 삭제와 별도 배치) */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeleteImage} 
            disabled={isPending}
            className="flex gap-1.5 border-red-500/50 text-red-400 hover:bg-red-50 hover:text-red-600 bg-slate-800"
          >
            <Trash2Icon className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">사진 삭제</span>
          </Button>

          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 px-3">
              닫기
            </Button>
          )}
        </div>
      </div>

      {/* 메인 캔버스 + 우측 패널 */}
      <div className="flex-1 w-full flex flex-row overflow-hidden relative">
        
        {/* 중앙 캔버스 워크스페이스 */}
        <div className="flex-1 h-full flex items-center justify-center p-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iIzMzNDE1NSI+PC9jaXJjbGU+Cjwvc3ZnPg==')] overflow-auto">
          <div className="shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-slate-700 bg-black relative rounded-sm outline-none">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* 우측 태그 속성 관리 패널 */}
        {isSidePanelOpen && (
          <div className="w-80 h-full bg-white flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.2)] z-30 transition-transform border-l border-slate-300">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TagsIcon className="w-4 h-4 text-slate-500" /> 치아 번호/태그 관리
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsSidePanelOpen(false)} className="h-8 w-8 text-slate-500 hover:text-slate-800">
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              {isTagsLoading ? (
                 <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                    <LoaderCircleIcon className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-sm">데이터 로딩 중...</span>
                 </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-slate-700">방사선 사진 (X-Ray)</Label>
                    <Switch checked={isRadio} onCheckedChange={setIsRadio} />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-slate-700">치아 번호 및 부가 태그 지정</Label>
                      <p className="text-[10px] text-slate-500">이 사진에 기록된 태그를 덮어씁니다.</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <DentalToothSelector 
                        species={species}
                        selectedIds={toothIds}
                        onChange={setToothIds}
                        otherTags={otherTags}
                        onOtherTagsChange={setOtherTags}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t bg-slate-50 shrink-0">
              <Button onClick={saveMarkAndTags} disabled={isPending} className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                {isPending ? <LoaderCircleIcon className="animate-spin w-4 h-4 mr-2" /> : <SaveIcon className="w-4 h-4 mr-2" />}
                마킹 + 태그 모두 저장
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
