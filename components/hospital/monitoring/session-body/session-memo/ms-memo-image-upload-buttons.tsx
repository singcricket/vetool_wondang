'use client'

import { Button } from '@/components/ui/button'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'

type Props = {
  isUploading: boolean
  cameraInputRef: React.RefObject<HTMLInputElement>
  galleryInputRef: React.RefObject<HTMLInputElement>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * 카메라 촬영 + 갤러리 업로드 버튼 묶음 컴포넌트
 * useMsMemoImageUpload 훅에서 반환되는 값들을 그대로 전달하면 됩니다.
 */
export default function MsMemoImageUploadButtons({
  isUploading,
  cameraInputRef,
  galleryInputRef,
  handleFileUpload,
}: Props) {
  return (
    <>
      {/* 숨김 처리된 파일 인풋들 */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleFileUpload}
      />
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        ref={galleryInputRef}
        onChange={handleFileUpload}
      />

      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        title="사진 촬영"
        disabled={isUploading}
        onClick={() => cameraInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        title="사진 업로드"
        disabled={isUploading}
        onClick={() => galleryInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </Button>
    </>
  )
}
