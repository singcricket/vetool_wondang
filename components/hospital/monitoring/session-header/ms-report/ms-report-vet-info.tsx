import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { useMonitoringContextData } from '@/providers/monitoring-hos-data-context-provider'

type Props = { msData: MsWithPatientWithWeight }

const TH = 'border border-gray-300 bg-gray-50 px-3 py-1.5 text-left text-xs font-semibold text-gray-600 w-28'
const TD = 'border border-gray-300 px-3 py-1.5 text-sm'

export default function MsReportVetInfo({ msData }: Props) {
  const sub = msData.vet_sub
const { msContextData } = useMonitoringContextData();
const { vetsListData } = msContextData;
  const rows: [string, string][] = [
    ['담당의', vetsListData.find((vet) => vet.user_id === msData.vet_main)?.name ?? ''],
    ['집도의', vetsListData.find((vet) => vet.user_id === msData.vet_primary)?.name ?? ''],
    ['보조의', vetsListData.find((vet) => vet.user_id === sub?.secondary)?.name ?? ''],
    ['마취의', vetsListData.find((vet) => vet.user_id === sub?.anesthesia)?.name ?? ''],
    ['기타', sub?.other ?? ''],
  ]

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">2. 수의사 정보</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            value && value!=="" && <tr key={label}>
              <th className={TH}>{label}</th>
              <td className={TD}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
