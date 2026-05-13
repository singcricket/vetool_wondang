'use client'

import MsAddTemplateDialog from './addtemplate/ms-add-template-dialog'
import DeleteMsChartDialog from './delete-mschart-dialog'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsReportContainer from '@/components/hospital/monitoring/session-header/ms-report/ms-report-container'
import MsMonitorDialog from '@/components/hospital/monitoring/session-header/ms-monitor/ms-monitor-dialog'
import { FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AddToCollectionDialog from '@/components/hospital/collections/add-to-collection-dialog'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  msData: MsWithPatientWithWeight
  hosId: string
  targetDate: string
}

export default function MsHeaderRightButtons({
  msData,
  hosId,
  targetDate,
}: Props) {
  const { session_id, patient } = msData
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  return (
    <div className="2xl:absolute 2xl:right-2 2xl:top-1.5 flex items-center gap-1">
      <div className="hidden sm:flex items-center gap-1">
        {userId && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCollectionOpen(true)}
              className="h-8 w-8 text-blue-600 hover:bg-blue-50 border-blue-200"
              title="컬렉션에 추가"
            >
              <FolderPlus size={16} />
            </Button>
            <AddToCollectionDialog 
              isOpen={isCollectionOpen}
              onOpenChange={setIsCollectionOpen}
              hosId={hosId}
              userId={userId}
              resourceType="monitoring"
              resourceId={session_id}
              resourceTitle={session_id}
            />
          </>
        )}

        <MsAddTemplateDialog 
          hosId={hosId}
          msData={msData} 
        />
        
        <MsReportContainer msData={msData} />

        <MsMonitorDialog msData={msData} />
      

      <DeleteMsChartDialog
        msData={msData}
        hosId={hosId}
        targetDate={targetDate}
      />
      </div>
    </div>
  )
}
