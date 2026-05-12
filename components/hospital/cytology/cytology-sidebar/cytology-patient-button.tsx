'use client'

import { Button } from '@/components/ui/button'
import SpeciesToIcon from '@/components/common/species-to-icon'
import type { Species } from '@/constants/hospital/register/signalments'
import type { CytologySidebarItem } from '@/lib/services/cytology/fetch-cytology'
import { cn, convertPascalCased } from '@/lib/utils/utils'
import { Microscope, UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

const SAMPLE_TYPE_LABEL: Record<string, string> = {
  otic: '귀도말',
  skin_impression: '피부도말',
  skin_exudate: '삼출물도말',
  fecal: '분변염색',
  vaginal: '질세포진',
  conjunctival: '결막도말',
  fna_skin: 'FNA-피부',
  fna_lymph: 'FNA-림프절',
  fna_organ: 'FNA-장기',
  effusion: '체강액',
  synovial: '관절액',
  csf: 'CSF',
  bal: 'BAL',
}

interface Props {
  item: CytologySidebarItem
  hosId: string
  targetDate: string
  isActive: boolean
  onClick?: () => void
}

export default function CytologyPatientButton({ item, hosId, targetDate, isActive, onClick }: Props) {
  const { push } = useRouter()

  return (
    <Button
      variant="outline"
      className={cn(
        isActive && 'border border-black bg-muted shadow-md',
        'relative flex h-auto w-full flex-col gap-0 px-1.5 py-1',
      )}
      onClick={() => {
        push(`/hospital/${hosId}/cytology/${targetDate}/${item.id}` as any)
        onClick?.()
      }}
    >
      {/* 환자명 + 차트번호 */}
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-bold">{item.patient_name}</span>
          <span className="text-xs font-light">{item.hos_patient_id}</span>
        </div>
        <span className="shrink-0 rounded bg-violet-100 px-1 py-0.5 text-[10px] font-bold text-violet-700">
          {SAMPLE_TYPE_LABEL[item.sample_type] ?? item.sample_type}
        </span>
      </div>

      {/* 담당자 */}
      <div className="mt-1 flex w-full items-center gap-1">
        <UserIcon style={{ width: 13, height: 13 }} />
        <span className="max-w-[70px] truncate text-xs">{item.evaluator_name ?? '미지정'}</span>
        <Microscope style={{ width: 11, height: 11 }} className="ml-auto text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{item.mode === 'ai' ? 'AI' : '전문가'}</span>
      </div>

      {/* 종 + 품종 */}
      <div className="mt-1 flex w-full items-center gap-1">
        <SpeciesToIcon species={item.species as Species} size={13} />
        <span className="truncate text-xs font-light">{convertPascalCased(item.breed)}</span>
      </div>
    </Button>
  )
}
