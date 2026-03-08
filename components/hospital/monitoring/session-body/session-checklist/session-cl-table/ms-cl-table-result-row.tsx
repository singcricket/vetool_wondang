'use client'

import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { VitalResults, VitalTimeSlot } from "@/types/monitoring/monitoring-type"
import { cn } from '@/lib/utils/utils'
import { useState } from "react"
import { updateMsVitalResults } from "@/lib/services/monitoring/update-ms"
import { useSafeRefresh } from "@/hooks/use-safe-refresh"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTransition } from "react"
import { toast } from "sonner"

type Props = {
    sessionId: string
    timeSlot: VitalTimeSlot
    slotIndex: number
    allVitalResults: VitalResults
    selectedVital: string[] | null
    clNames: string[]
    startTime: string | null
}

export default function MsClTableResultRow({
    sessionId,
    timeSlot,
    slotIndex,
    allVitalResults,
    selectedVital,
    clNames,
    startTime
}: Props) {
    const refresh = useSafeRefresh()
    const [isUpdating, setIsUpdating] = useState(false)
    const [isPending, startTransition] = useTransition()
    const selectedClNames: string[] = selectedVital && selectedVital.length > 0 ? [...selectedVital] : [...clNames]
    
    const handleUpdateValue = async (vitalName: string, newValue: string) => {
        // 기존 값과 같으면 업데이트 하지 않음
        const currentEntry = timeSlot.vitals.find(v => v.vitalName === vitalName)
        if (currentEntry?.value === newValue) return

        setIsUpdating(true)

        // 신규 배열 생성
        const updatedVitals = timeSlot.vitals.map(v => 
            v.vitalName === vitalName ? { ...v, value: newValue } : v
        )
        
        // 만약 기존 항목에 없던 항목이라면 추가 (타입 안정성을 위해)
        if (!timeSlot.vitals.find(v => v.vitalName === vitalName)) {
            updatedVitals.push({ vitalName, value: newValue })
        }

        const updatedTimeSlot = { ...timeSlot, vitals: updatedVitals }
        const updatedResults = allVitalResults.map((slot, idx) => 
            idx === slotIndex ? updatedTimeSlot : slot
        )

        const success = await updateMsVitalResults(sessionId, updatedResults)
        if (success) {
            // refresh() 제거: 수정 시에는 화면 전체를 새로고침하지 않고 DB만 업데이트
        }
        setIsUpdating(false)
    }

    const handleUpdateMinTime = async (newMinTime: string) => {
        if (timeSlot.minTime === newMinTime) return
        setIsUpdating(true)

        const updatedTimeSlot = { ...timeSlot, minTime: newMinTime }
        const updatedResults = allVitalResults.map((slot, idx) => 
            idx === slotIndex ? updatedTimeSlot : slot
        )

        const success = await updateMsVitalResults(sessionId, updatedResults)
        if (success) {
             // refresh() 제거: 수정 시에는 화면 전체를 새로고침하지 않고 DB만 업데이트
        }
        setIsUpdating(false)
    }

    const handleDeleteRow = async () => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        setIsUpdating(true)

        const updatedResults = allVitalResults.filter((_, idx) => idx !== slotIndex)
        const success = await updateMsVitalResults(sessionId, updatedResults)
        
        if (success) {
           toast("삭제 완료")
        }
        setIsUpdating(false)
    }

    return (
        <TableRow className="relative divide-x transition-colors hover:bg-muted/30">
            <TableCell className="p-0" style={{ width: 128 }}>
                <div className="relative flex items-center">
                    <Input
                        className="h-11 rounded-none border-0 bg-transparent text-center ring-inset focus-visible:ring-1 pr-12"
                        defaultValue={timeSlot.minTime}
                        onBlur={(e) => handleUpdateMinTime(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        disabled={isUpdating}
                    />
                    {startTime && (
                        <span className="absolute right-1 text-xs text-muted-foreground pointer-events-none">
                            ({new Date(new Date(startTime).getTime() + Number(timeSlot.minTime) * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                    )}
                </div>
            </TableCell>
            {clNames.map((vital) => {
                if (selectedClNames.includes(vital)) {
                    const vitalEntry = timeSlot.vitals.find(v => v.vitalName === vital)
                    return (
                        <TableCell className="handle group p-0" key={vital}>
                            <div className={cn('[&:focus-within_.tx-result-overlay]:opacity-50', 'relative [&:focus-within_.tx-result-overlay]:overflow-visible')}>
                                <Input
                                    className="h-11 rounded-none border-none bg-transparent px-1 text-center ring-inset focus-visible:ring-1"
                                    defaultValue={vitalEntry?.value || ''}
                                    onBlur={(e) => handleUpdateValue(vital, e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                    disabled={isUpdating}
                                />
                            </div>
                        </TableCell>
                    )
                }
                return null
            })}
            <TableCell className="p-0 text-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-full text-muted-foreground hover:text-destructive"
                    onClick={handleDeleteRow}
                    disabled={isUpdating}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}
