import { Button } from '@/components/ui/button'
import { ClipboardCheckIcon, CopyIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CopyButton({
  copyResult,
  iconOnly = false,
}: {
  copyResult: string
  iconOnly?: boolean
}) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyResult = () => {
    setIsCopied(true)

    if (copyResult) {
      navigator.clipboard.writeText(copyResult.toString())

      toast.success('계산 결과가 클립보드에 복사되었습니다')
    }

    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Button
      onClick={handleCopyResult}
      variant="ghost"
      size={iconOnly ? 'icon' : 'default'}
    >
      {isCopied ? <ClipboardCheckIcon /> : <CopyIcon />}
      {!iconOnly && '복사'}
    </Button>
  )
}
