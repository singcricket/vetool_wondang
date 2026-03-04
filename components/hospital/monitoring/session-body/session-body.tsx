
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'

import MsInfoContainer from '@/components/hospital/monitoring/session-body/session-info/session-info-container'
import MsMemoContainer from '@/components/hospital/monitoring/session-body/session-memo/ms-memo-container'
type Props = {
  msData : MsWithPatientWithWeight
  targetDate: string
  hosId: string
}

export default function SessionBody({ msData, targetDate, hosId }: Props) {
 
  return (
    <div className="mt-12 flex w-[420vw] flex-col gap-2 p-2 sm:w-[300vw] md:w-full">
        <MsInfoContainer msData={msData} />
        <MsMemoContainer msData={msData} />
      {/* <ChartInfos chartData={chartData} />

      <ChartTable chartData={chartData} targetDate={targetDate} hosId={hosId} />

      <ChartMemos
        memoA={memo_a as Memo[] | null}
        memoB={memo_b as Memo[] | null}
        memoC={memo_c as Memo[] | null}
        icuIoId={icu_io_id}
      /> */}
    </div>
  )
}
