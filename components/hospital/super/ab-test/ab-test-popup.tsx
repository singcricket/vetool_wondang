'use client'

import SubmitButton from '@/components/common/submit-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { submitAbTestResult } from '@/lib/services/ab-test/submit-ab-test'
import { CheckIcon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const TEST_NAME = 'ai_feature'
const MAX_SUBMISSION_COUNT = 10

type Props = {
  hosId: string
  targetDate: string
}

export default function AbTestPopup({ hosId, targetDate }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (window.innerWidth < 768) return

    const submissionKey = `ab_test_submission_count_${TEST_NAME}`
    const submissionCount = parseInt(
      localStorage.getItem(submissionKey) || '0',
      10,
    )

    if (submissionCount < MAX_SUBMISSION_COUNT) {
      setOpen(true)
    }
  }, [hosId, targetDate])

  const handleSubmit = async () => {
    if (!selected) return

    setIsSubmitting(true)
    try {
      await submitAbTestResult(hosId, TEST_NAME, selected, feedback)

      const submissionKey = `ab_test_submission_count_${TEST_NAME}`
      const cur = parseInt(localStorage.getItem(submissionKey) || '0', 10)
      localStorage.setItem(submissionKey, (cur + 1).toString())

      toast.success('피드백 감사합니다!')
      setOpen(false)
    } catch (error) {
      toast.error('피드백 제출 실패')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>벳툴 발전에 기여해주세요!</DialogTitle>
          <DialogDescription>어떤 UI/UX가 더 좋을까요?</DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selected || ''}
          onValueChange={(val) => setSelected(val as 'A' | 'B' | 'C')}
          className="flex flex-col gap-8 pt-4"
        >
          <div className="grid grid-cols-2 gap-8">
            {/* Option A */}
            <div className="relative flex flex-col items-center space-y-4">
              <RadioGroupItem
                value="A"
                id="option-a"
                className="peer sr-only"
              />
              <Label
                htmlFor="option-a"
                className="group relative flex h-[380px] w-[380px] cursor-pointer flex-col items-center border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="flex flex-col items-center gap-10 text-muted-foreground">
                  <Image
                    src="https://ognykpkimfcqlhtttlss.supabase.co/storage/v1/object/public/ab_test_assets/overflow_hidden.png"
                    alt="overflow"
                    width={200}
                    height={50}
                  />
                  <Image
                    src="https://ognykpkimfcqlhtttlss.supabase.co/storage/v1/object/public/ab_test_assets/overflow_hidden_adv.png"
                    alt="overflow"
                    width={200}
                    height={50}
                  />
                </div>

                <div className="mt-auto flex w-full flex-col items-center">
                  <span className="mt-2 text-base font-bold">
                    A. 기존방식: 처치결과 숨김, 마우스 올리면 내용 보임
                  </span>

                  <div className="mt-2 flex flex-col">
                    <p>장점: 깔끔함, 인접한 처치결과가 있을 경우 겹치지 않음</p>
                    <p>단점: 처치결과가 보이지 않음</p>
                  </div>
                </div>

                {/* Checkmark overlay for selected state */}
                {selected === 'A' && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                    <CheckIcon className="h-4 w-4" />
                  </div>
                )}
              </Label>
            </div>

            {/* Option B */}
            <div className="relative flex flex-col items-center space-y-4">
              <RadioGroupItem
                value="B"
                id="option-b"
                className="peer sr-only"
              />
              <Label
                htmlFor="option-b"
                className="group relative flex h-[380px] w-[380px] cursor-pointer flex-col items-center border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="flex flex-col items-center gap-10 text-muted-foreground">
                  <Image
                    src="https://ognykpkimfcqlhtttlss.supabase.co/storage/v1/object/public/ab_test_assets/overflow.png"
                    alt="overflow"
                    width={200}
                    height={50}
                  />
                  <Image
                    src="https://ognykpkimfcqlhtttlss.supabase.co/storage/v1/object/public/ab_test_assets/overflow_dis.png"
                    alt="overflow"
                    width={200}
                    height={50}
                  />
                </div>

                <div className="mt-auto flex w-full flex-col items-center">
                  <span className="mt-2 text-base font-bold">
                    B. CELL을 벗어나도 내용을 보여줌
                  </span>

                  <div className="mt-2 flex flex-col">
                    <p>장점: 처치결과가 보임</p>
                    <p>단점: 인접한 처치결과가 있을 경우 겹침</p>
                  </div>
                </div>

                {/* Checkmark overlay for selected state */}
                {selected === 'B' && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                    <CheckIcon className="h-4 w-4" />
                  </div>
                )}
              </Label>
            </div>
          </div>

          {/* Option C (Textarea) */}
          <div className="space-y-2">
            <div className="relative">
              <RadioGroupItem
                value="C"
                id="option-c"
                className="peer sr-only"
              />
              <Label
                htmlFor="option-c"
                className="block cursor-pointer rounded-md border-2 border-transparent p-2 peer-data-[state=checked]:border-primary"
              >
                <div className="mb-2 font-medium">
                  C. 기타 의견이 있으시다면 자유롭게 적어주세요.
                </div>
                <Textarea
                  id="other-opinion-textarea"
                  placeholder="개인 PC라서 이미 제출했습니다."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onFocus={() => setSelected('C')}
                  className="min-h-[100px]"
                />
              </Label>
              {selected === 'C' && (
                <div className="absolute right-[-10px] top-[-10px] rounded-full bg-primary p-1 text-primary-foreground">
                  <CheckIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </RadioGroup>

        <h4 className="mt-4 text-center text-sm text-muted-foreground">
          A/B 테스트는 PC당 {MAX_SUBMISSION_COUNT}회 진행되며{' '}
          {MAX_SUBMISSION_COUNT}회 제출 후에 사라집니다.
          <br />
          다양한 의견을 반영하기 위해 이미 제출하신 분은 닫기를 눌러주세요.
        </h4>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            닫기
          </Button>
          <SubmitButton
            buttonText="제출"
            isPending={isSubmitting}
            disabled={!selected || isSubmitting}
            onClick={handleSubmit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
