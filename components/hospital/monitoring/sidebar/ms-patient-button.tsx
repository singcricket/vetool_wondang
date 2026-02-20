'use client'

import SpeciesToIcon from '@/components/common/species-to-icon'
import { Button } from '@/components/ui/button'
import type { MonitoringSidebarData } from '@/lib/services/monitoring/fetch-ms-data'
import { cn, convertPascalCased } from '@/lib/utils/utils'
import type { Species } from '@/constants/hospital/register/signalments'
import { ClockIcon, StethoscopeIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import type { Vet } from '@/types'
import { useMonitoringContextData } from '@/providers/monitoring-hos-data-context-provider'

type Props = {
  monitoringSession: MonitoringSidebarData
  hosId: string
  targetDate: string
  vetList: Vet[]
}

export default function MsPatientButton({
  monitoringSession,
  hosId,
  targetDate,
  vetList,
}: Props) {
  const { start_time, end_time, session_title, session_group, vet_main, vet_sub } =
    monitoringSession

  const process = !start_time ? 'pending' : !end_time ? 'processing' : 'ended'

  const { push } = useRouter()
  const pathname = usePathname()
  const path = pathname.split('/')
  const isPatientSelected = path.indexOf(monitoringSession.session_id) !== -1

  const formattedStartedTime = start_time
    ? new Date(start_time).toLocaleTimeString('ko-KR', { hour12: false })
    : ''

  const {
    clContextData: { vetsListData },
  } = useMonitoringContextData()

  const foundVet = vetsListData.find(
    (vet : Vet) => vet.user_id === vet_main,
  ) // 주치의

  const handlePatientButtonClick = () =>
    push(
      `/hospital/${hosId}/monitoring/${targetDate}/monitoring-session/${monitoringSession.session_id}/session`,
    )

  return (
    <Button
      variant="outline"
      className={cn(
        'h-auto w-full px-2 py-1 text-xs',
        isPatientSelected && 'border border-black bg-muted shadow-md',
      )}
      onClick={handlePatientButtonClick}
    >
      <div className={cn('flex w-full flex-col justify-between')}>
        <div className="mb-1 flex justify-between">
          <div className="font-bold">
            {session_title && session_title.length > 0
              ? session_title
              : '미지정'}
          </div>

          <div>{session_group}</div>
        </div>

        <div className="flex justify-between gap-2">
          <div className="flex items-center gap-1 text-sm">
            <SpeciesToIcon
              species={monitoringSession.patient?.species as Species}
              size={16}
            />
            {monitoringSession.patient?.name ?? '미등록'}(
            {monitoringSession.patient?.hos_patient_id ?? '-'})
          </div>
          <div className="max-w-[96px] truncate">
            {convertPascalCased(monitoringSession.patient?.breed ?? '-')}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <div className="ml-0.5 flex items-center gap-0.5">
            <StethoscopeIcon style={{ width: 12, height: 12 }} />
            술자 : {vet_sub.primary==='' ? '미지정' : vet_sub.primary } / 주치의 : {foundVet?.name ?? '미지정'}
          </div>

          <div className="flex items-center gap-0.5">
            <ClockIcon style={{ width: 12, height: 12 }} />
            {process === 'pending' && '대기중'}
            {process === 'ended' && '종료'}
            {process === 'processing' && `${formattedStartedTime}`}
          </div>
        </div>
      </div>
    </Button>
  )
}
