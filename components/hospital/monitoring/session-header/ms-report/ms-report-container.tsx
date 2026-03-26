'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { buildMsReportText } from './build-ms-report-text'
import { useMonitoringContextData } from '@/providers/monitoring-hos-data-context-provider'
import MsReportContent from './ms-report-content'

type Props = {
  msData: MsWithPatientWithWeight
}

export default function MsReportContainer({ msData }: Props) {
  const [isParentsDialogOpen, setIsParentsDialogOpen] = useState(false)

  const { msContextData } = useMonitoringContextData()
  const { vetsListData } = msContextData

  const handleExportText = async () => {
    try {
      const text = buildMsReportText(msData, vetsListData)
      await navigator.clipboard.writeText(text)
      toast.success('리포트 텍스트를 클립보드에 복사했습니다.')
    } catch (error) {
      console.error(error)
      toast.error('클립보드 복사 중 오류가 발생했습니다.')
    }
  }

  return (
    <Dialog open={isParentsDialogOpen} onOpenChange={setIsParentsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="모니터링 리포트">
          <FileText />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex w-[95vw] max-w-5xl max-h-[90vh] sm:max-h-[85vh] flex-col overflow-hidden sm:p-6 p-4">
        <MsReportContent 
          msData={msData} 
          isSharedView={false} 
          onExportText={handleExportText} 
          onClose={() => setIsParentsDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

