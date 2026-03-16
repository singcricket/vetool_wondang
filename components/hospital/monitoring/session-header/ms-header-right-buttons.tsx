import MsAddTemplateDialog from './addtemplate/ms-add-template-dialog'
import DeleteMsChartDialog from './delete-mschart-dialog'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import MsReportContainer from '@/components/hospital/monitoring/session-header/ms-report/ms-report-container'

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
    <div className="absolute right-2 top-1.5 hidden  2xl:flex">
      <MsAddTemplateDialog 
      hosId={hosId}
      msData={msData} />
     

      {/* <ShareChartDialog icuIoId={icu_io.icu_io_id} targetDate={targetDate} /> */}

      {/* <CopyChartButton icuChartId={icu_chart_id} /> */}

      <MsReportContainer  msData={msData} />

      {/* <DischargeDialog icuIo={chartData.icu_io} patient={chartData.patient} /> */}

      <DeleteMsChartDialog
       msData={msData}
       hosId={hosId}
       targetDate={targetDate}
      />
    </div>
  )
}
