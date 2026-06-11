'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateHosInfo, type HosInfo } from '@/lib/actions/admin/hos-info-actions'
import { MapPin, Phone, Clock, Quote, Save } from 'lucide-react'

interface Props {
  hosId: string
  hosName: string
  initialInfo: HosInfo | null
}

export default function HosInfoForm({ hosId, hosName, initialInfo }: Props) {
  const [form, setForm] = useState<HosInfo>({
    address: initialInfo?.address ?? '',
    phone: initialInfo?.phone ?? '',
    hours: initialInfo?.hours ?? '',
    tagline: initialInfo?.tagline ?? '',
  })
  const [pending, startTransition] = useTransition()

  const set = (key: keyof HosInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateHosInfo(hosId, form)
        toast.success('병원 정보가 저장되었습니다.')
      } catch {
        toast.error('저장에 실패했습니다.')
      }
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400">병원명</p>
        <p className="mt-0.5 text-base font-bold text-slate-800">{hosName}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">병원명은 병원 기본 설정에서 변경할 수 있습니다.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <Field icon={MapPin} label="주소">
          <Input
            value={form.address}
            onChange={set('address')}
            placeholder="예: 서울특별시 강남구 테헤란로 123"
            className="h-8 text-sm"
          />
        </Field>

        <Field icon={Phone} label="전화번호">
          <Input
            value={form.phone}
            onChange={set('phone')}
            placeholder="예: 02-1234-5678"
            className="h-8 text-sm"
          />
        </Field>

        <Field icon={Clock} label="진료시간">
          <Textarea
            value={form.hours}
            onChange={set('hours')}
            placeholder={'예: 평일 09:00 – 18:00\n토요일 09:00 – 14:00\n일요일·공휴일 휴진'}
            className="min-h-[80px] resize-none text-sm"
          />
        </Field>

        <Field icon={Quote} label="표지 문구">
          <Textarea
            value={form.tagline}
            onChange={set('tagline')}
            placeholder="리포트 표지에 표시될 문구를 입력하세요."
            className="min-h-[60px] resize-none text-sm"
          />
        </Field>
      </div>

      <Button
        onClick={handleSave}
        disabled={pending}
        className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700"
      >
        <Save size={14} />
        {pending ? '저장 중...' : '저장'}
      </Button>
    </div>
  )
}

function Field({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-slate-400" strokeWidth={2} />
        <p className="text-xs font-semibold text-slate-600">{label}</p>
      </div>
      {children}
    </div>
  )
}
