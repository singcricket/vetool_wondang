'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { VitalResults } from "@/types/monitoring/monitoring-type"

type Props = {
  vitalResults: VitalResults | null
  plannedVitals: string[] | null
}

export default function MsMonitorVitalTable({ vitalResults, plannedVitals }: Props) {
  return (
    <div className="border-t flex flex-col overflow-hidden bg-muted/5">
      <div className="px-6 py-3 bg-muted/20 border-b flex items-center justify-between">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          바이탈 측정 기록
        </h4>
        <span className="text-xs text-muted-foreground">최근 순 정렬</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 px-3 text-left font-medium">시간</th>
                {plannedVitals?.map(vital => (
                  <th key={vital} className="py-2 px-3 text-left font-medium">{vital}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vitalResults && vitalResults.length > 0 ? (
                [...vitalResults].reverse().map((slot, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-primary">{slot.minTime}</td>
                    {plannedVitals?.map(vitalName => {
                      const entry = slot.vitals.find(v => v.vitalName === vitalName);
                      return (
                        <td key={vitalName} className="py-3 px-3 tabular-nums">
                          {entry?.value || '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={(plannedVitals?.length || 0) + 1} className="py-10 text-center text-muted-foreground italic">
                    측정 기록이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  )
}
