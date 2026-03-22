import MsAddTemplateDialog from './addtemplate/ms-add-template-dialog'
import DeleteMsChartDialog from './delete-mschart-dialog'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsReportContainer from '@/components/hospital/monitoring/session-header/ms-report/ms-report-container'
import MsMonitorDialog from '@/components/hospital/monitoring/session-header/ms-monitor/ms-monitor-dialog'

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

  return (
    <div className="2xl:absolute 2xl:right-2 2xl:top-1.5 flex">
      <MsAddTemplateDialog 
      hosId={hosId}
      msData={msData} />
     

      <MsReportContainer  msData={msData} />

      <MsMonitorDialog
       msData={msData}
      />

      <DeleteMsChartDialog
       msData={msData}
       hosId={hosId}
       targetDate={targetDate}
      />
    </div>
  )
}
