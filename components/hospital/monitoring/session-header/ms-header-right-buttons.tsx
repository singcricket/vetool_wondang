import DeleteMsChartDialog from './delete-mschart-dialog'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
// import AddTemplateDialog from './add-template-dialog'
// import DischargeDialog from './discharge/discharge-dialog'

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
    <div className="absolute right-2 top-1.5 hidden gap-1 2xl:flex">
      {/* <AddTemplateDialog
        orders={orders}
        patientName={patient.name}
        hosId={hosId}
      />

      <ShareChartDialog icuIoId={icu_io.icu_io_id} targetDate={targetDate} />

      <CopyChartButton icuChartId={icu_chart_id} />

      <ExportDialog chartData={chartData} />

      <DischargeDialog icuIo={chartData.icu_io} patient={chartData.patient} /> */}

      <DeleteMsChartDialog
       msData={msData}
       hosId={hosId}
       targetDate={targetDate}
      />
    </div>
  )
}
