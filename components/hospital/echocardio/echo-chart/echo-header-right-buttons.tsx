'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LoaderCircleIcon, Settings2Icon, Trash2Icon } from 'lucide-react'
import type { EchoChartDetail } from '@/types/echocardio/echocardio-type'
import EchoSettingsPanel from '../echo-settings/echo-settings-panel'
import DeleteEchoChartDialog from './delete-echo-chart-dialog'

type Props = {
  hosId: string
  targetDate: string
  chartDetail: EchoChartDetail
}

export default function EchoHeaderRightButtons({
  hosId,
  targetDate,
  chartDetail,
}: Props) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <DeleteEchoChartDialog
        chartDetail={chartDetail}
        hosId={hosId}
        targetDate={targetDate}
      />
    </div>
  )
}
