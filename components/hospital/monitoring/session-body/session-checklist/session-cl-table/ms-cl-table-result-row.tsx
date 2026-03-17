'use client'

import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { VitalTimeSlot } from "@/types/monitoring/monitoring-type"
import { cn } from '@/lib/utils/utils'
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { VITAL_REFERENCE_DATA } from "@/types/monitoring/monitoring-type"

type Props = {
    timeSlot: VitalTimeSlot
    selectedVital: string[] | null
    clNames: string[]
    startTime: string | null
    isUpdating: boolean
    onVitalChange: (vitalName: string, value: string) => void
    onMinTimeChange: (newMinTime: string) => void
    onDeleteRow: () => void
}

export default function MsClTableResultRow({
    timeSlot,
    selectedVital,
    clNames,
    startTime,
    isUpdating,
    onVitalChange,
    onMinTimeChange,
    onDeleteRow,
}: Props) {
    const selectedClNames: string[] = selectedVital && selectedVital.length > 0 ? [...selectedVital] : [...clNames]
    // minTime은 blur 시 반영 (숫자 형식 입력 편의를 위해 로컬 state 유지)
    const [localMinTime, setLocalMinTime] = useState(timeSlot.minTime)

    return (
        <TableRow className="relative divide-x transition-colors hover:bg-muted/30">
            <TableCell className="p-0" style={{ width: 128 }}>
                <div className="relative flex items-center">
                    <Input
                        className="h-11 rounded-none border-0 bg-transparent text-center ring-inset focus-visible:ring-1 pr-12"
                        value={localMinTime}
                        onChange={(e) => setLocalMinTime(e.target.value)}
                        onBlur={(e) => onMinTimeChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        disabled={isUpdating}
                    />
                    {startTime && (
                        <span className="absolute right-1 text-xs text-muted-foreground pointer-events-none">
                            ({new Date(new Date(startTime).getTime() + Number(localMinTime) * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                    )}
                </div>
            </TableCell>
            {clNames.map((vital) => {
                if (selectedClNames.includes(vital)) {
                    const vitalEntry = timeSlot.vitals.find(v => v.vitalName === vital)
                    const vitalConfig = VITAL_REFERENCE_DATA.find(v => v.vitalName === vital)
                    const isSelect = vitalConfig?.type === 'select'

                    return (
                        <TableCell className="handle group p-0" key={vital}>
                            <div className={cn('[&:focus-within_.tx-result-overlay]:opacity-50', 'relative [&:focus-within_.tx-result-overlay]:overflow-visible')}>
                                {isSelect ? (
                                    <Select
                                        value={vitalEntry?.value ?? ''}
                                        onValueChange={(value) => onVitalChange(vital, value)}
                                        disabled={isUpdating}
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-none border-none bg-transparent px-1 text-center ring-inset focus:ring-1 focus-visible:ring-1 shadow-none justify-center">
                                            <SelectValue placeholder="" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vitalConfig?.options?.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        className="h-11 rounded-none border-none bg-transparent px-1 text-center ring-inset focus-visible:ring-1"
                                        value={vitalEntry?.value ?? ''}
                                        onChange={(e) => onVitalChange(vital, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        disabled={isUpdating}
                                    />
                                )}
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
                    onClick={onDeleteRow}
                    disabled={isUpdating}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}
