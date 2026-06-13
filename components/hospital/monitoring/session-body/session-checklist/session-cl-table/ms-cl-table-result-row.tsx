'use client'

import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { VitalTimeSlot } from "@/types/monitoring/monitoring-type"
import { cn } from '@/lib/utils/utils'
import { Trash2, ArrowUp, ArrowDown } from "lucide-react"
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
    species: 'canine' | 'feline' | null
    onVitalChange: (vitalName: string, value: string) => void
    onMinTimeChange: (newMinTime: string) => void
    onDeleteRow: () => void
}

function getRangeStatus(vitalName: string, value: string, species: 'canine' | 'feline' | null): 'high' | 'low' | 'normal' {
    const config = VITAL_REFERENCE_DATA.find((v) => v.vitalName === vitalName)
    if (!config || config.type !== 'range' || !value.trim()) return 'normal'
    const num = parseFloat(value)
    if (isNaN(num)) return 'normal'
    const sp = species ?? 'canine'
    const range = sp === 'feline' ? (config.feline ?? config.canine) : (config.canine ?? config.feline)
    if (!range) return 'normal'
    if (num > parseFloat(range.max)) return 'high'
    if (num < parseFloat(range.min)) return 'low'
    return 'normal'
}

export default function MsClTableResultRow({
    timeSlot,
    selectedVital,
    clNames,
    startTime,
    isUpdating,
    species,
    onVitalChange,
    onMinTimeChange,
    onDeleteRow,
}: Props) {
    const selectedClNames: string[] = selectedVital && selectedVital.length > 0 ? [...selectedVital] : [...clNames]
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
                if (!selectedClNames.includes(vital)) return null

                const vitalEntry = timeSlot.vitals.find(v => v.vitalName === vital)
                const vitalConfig = VITAL_REFERENCE_DATA.find(v => v.vitalName === vital)
                const isSelect = vitalConfig?.type === 'select'
                const rangeStatus = isSelect ? 'normal' : getRangeStatus(vital, vitalEntry?.value ?? '', species)

                return (
                    <TableCell className={cn(
                                        'handle group p-0',
                                        rangeStatus === 'high' && 'bg-red-50',
                                        rangeStatus === 'low' && 'bg-blue-50',
                                    )} key={vital}>
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
                                <div className="relative flex items-center justify-center">
                                    <Input
                                        className={cn(
                                            'h-11 rounded-none border-none bg-transparent px-1 text-center ring-inset focus-visible:ring-1',
                                            rangeStatus === 'high' && 'text-red-600 font-medium',
                                            rangeStatus === 'low' && 'text-blue-600 font-medium',
                                        )}
                                        value={vitalEntry?.value ?? ''}
                                        onChange={(e) => onVitalChange(vital, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        disabled={isUpdating}
                                    />
                                    {rangeStatus !== 'normal' && vitalEntry?.value && (
                                        <span className={cn(
                                            'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none',
                                            rangeStatus === 'high' ? 'text-red-400' : 'text-blue-400'
                                        )}>
                                            {rangeStatus === 'high' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </TableCell>
                )
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
