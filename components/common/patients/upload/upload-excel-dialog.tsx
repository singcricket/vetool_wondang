'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import usePatientFileUpload from '@/hooks/use-patient-file-upload'
import { cn } from '@/lib/utils/utils'
import { DialogClose } from '@radix-ui/react-dialog'
import { ExternalLinkIcon, InfoIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import SubmitButton from '../../submit-button'

export default function UploadExcelDialog({ hosId }: { hosId: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState('intoVet')

  const {
    selectedFile,
    uploadStatus,
    isLoading,
    handleFileSelection,
    handleUpload,
  } = usePatientFileUpload(hosId, () => {
    setIsDialogOpen(false)
    toast.success('환자 목록을 업로드하였습니다')
    window.location.reload()
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      handleFileSelection(file)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      handleFileSelection(null)
    }
    setIsDialogOpen(open)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">일괄 업로드</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            환자 목록 일괄 업로드
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-2">
            <span>메인차트에 등록된 환자들을 한 번에 등록하세요.</span>
            <a
              href="/announcements/a1608149-ed2d-4e49-99ef-957927578f2f"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <InfoIcon className="h-3.5 w-3.5" />
              메인차트에서 환자목록 내보내는 방법
              <ExternalLinkIcon className="ml-0.5 h-3 w-3 opacity-70" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Step 1: Program Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              1. 메인 차트 선택
            </Label>
            <RadioGroup
              value={uploadType}
              onValueChange={setUploadType}
              className="grid grid-cols-2 gap-3"
            >
              <div
                className={cn(
                  'relative flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-accent',
                  uploadType === 'intoVet'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted bg-transparent',
                )}
                onClick={() => setUploadType('intoVet')}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-bold underline decoration-primary/30 underline-offset-4">
                    인투벳
                  </span>
                  <span className="text-xs text-muted-foreground">IntoVet</span>
                </div>
                <RadioGroupItem
                  value="intoVet"
                  id="intoVet"
                  className="sr-only"
                />
              </div>
              <div
                className={cn(
                  'relative flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-accent',
                  uploadType === 'efriends'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted bg-transparent',
                )}
                onClick={() => setUploadType('efriends')}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-bold underline decoration-primary/30 underline-offset-4">
                    이프렌즈
                  </span>
                  <span className="text-xs text-muted-foreground">
                    e-Friends
                  </span>
                </div>
                <RadioGroupItem
                  value="efriends"
                  id="efriends"
                  className="sr-only"
                />
              </div>
            </RadioGroup>
          </div>

          {/* Step 2: File Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              2. 파일 선택
            </Label>
            <div className="group relative flex flex-col gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-6 transition-colors hover:bg-muted/50">
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isLoading}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <div className="rounded-full bg-background p-2 shadow-sm">
                  <svg
                    className="h-6 w-6 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div className="text-sm font-medium">
                  {selectedFile ? (
                    <span className="text-primary">{selectedFile.name}</span>
                  ) : (
                    <span>클릭하여 파일 선택</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Excel (.xlsx, .xls) 또는 CSV 파일
                </p>
              </div>
            </div>
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-medium">{uploadStatus}</p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-in-out"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="animate-pulse text-center text-xs text-muted-foreground">
                파일을 처리하고 있습니다. 잠시만 기다려주세요...
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              취소
            </Button>
          </DialogClose>

          <SubmitButton
            onClick={() => handleUpload(uploadType)}
            isPending={isLoading}
            buttonText="업로드"
            disabled={!selectedFile || isLoading}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
