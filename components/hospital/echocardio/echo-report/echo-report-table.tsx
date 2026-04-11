import type { EchoTest } from '@/types/echocardio/echocardio-type'
import { getMmodeRef } from '@/constants/hospital/echocardio/mmode-ref-dog'
import { getCatMmodeRef } from '@/constants/hospital/echocardio/mmode-ref-dog' // Note: assuming both are in this file as seen in view_file

interface EchoReportTableProps {
  label: string
  items: {
    keyword_id: string
    value: string | null
    meta: EchoTest
    computed?: { result: string; comment: string }
  }[]
  isUppercase?: boolean
  bwKg: number
  species: 'canine' | 'feline'
}

export default function EchoReportTable({ 
  label, 
  items, 
  isUppercase = false,
  bwKg,
  species
}: EchoReportTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={`border-l-4 border-primary pl-2 text-sm font-bold ${isUppercase ? 'uppercase' : ''}`}>
        {label}
      </h3>
      <table className="w-full border-collapse text-xs print:text-[10px]">
        <thead>
          <tr className="bg-muted/30">
            <th className="border px-2 py-1 text-left font-semibold w-1/4">항목</th>
            <th className="border px-2 py-1 text-center font-semibold w-1/6">측정값</th>
            <th className="border px-2 py-1 text-center font-semibold w-1/6">정상범위</th>
            <th className="border px-2 py-1 text-center font-semibold w-1/6">판정</th>
            <th className="border px-2 py-1 text-left font-semibold">소견</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isAbnormal = item.computed?.result && 
              !['normal', 'Normal', ''].includes(item.computed.result)
            
            // M-mode 참조값 동적 계산
            let displayRef = item.meta.testref || '-'
            if (bwKg > 0) {
              if (item.meta.testType === 'mmode_range' && item.meta.refTable === 'mmoderef_dog' && species === 'canine') {
                const ref = getMmodeRef(bwKg, item.keyword_id)
                if (ref) displayRef = `${ref[0]} - ${ref[1]}`
              } else if (item.meta.testType === 'mmode_formula' && species === 'feline') {
                const ref = getCatMmodeRef(item.keyword_id as any, bwKg)
                if (ref) displayRef = `${ref[0].toFixed(2)} - ${ref[1].toFixed(2)}`
              }
            }

            return (
              <tr key={item.keyword_id} className={isAbnormal ? 'bg-red-50/50 print:bg-red-50/30' : ''}>
                <td className="border px-2 py-1 font-medium">{item.meta.keywordName}</td>
                <td className="border px-2 py-1 text-center">
                  {item.value || '-'} {'unit' in item.meta ? item.meta.unit : ''}
                </td>
                <td className="border px-2 py-1 text-center text-muted-foreground whitespace-pre-wrap">
                  {displayRef}
                </td>
                <td className="border px-2 py-1 text-center">
                  <span className={isAbnormal ? 'text-red-600 font-bold' : 'text-green-700'}>
                    {item.computed?.result || '-'}
                  </span>
                </td>
                <td className="border px-2 py-1 text-muted-foreground">{item.computed?.comment || '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
