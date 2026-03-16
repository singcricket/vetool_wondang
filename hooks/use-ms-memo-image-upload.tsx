import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { uploadMsMemoImage } from '@/lib/services/monitoring/upload-ms-memo-image'

type UseMsMemoImageUploadProps = {
  sessionId: string
  onUploadComplete: (imgUrls: string[]) => Promise<void>
}

export const useMsMemoImageUpload = ({
  sessionId,
  onUploadComplete,
}: UseMsMemoImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadMsMemoImage(file, sessionId),
      )
      const results = await Promise.all(uploadPromises)

      const successfulUrls = results
        .filter((result) => !result.error && result.url)
        .map((result) => result.url as string)

      if (successfulUrls.length === 0) {
        toast.error('이미지 업로드에 실패했습니다.')
      } else {
        if (successfulUrls.length < files.length) {
          toast.warning(
            `일부 이미지 업로드 실패 (${successfulUrls.length}/${files.length} 성공)`,
          )
        }
        await onUploadComplete(successfulUrls)
      }
    } catch (error) {
      toast.error('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return {
    isUploading,
    cameraInputRef,
    galleryInputRef,
    handleFileUpload,
  }
}
