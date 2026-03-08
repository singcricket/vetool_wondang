'use client'

import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import { MsWithPatientWithWeight } from "@/lib/services/monitoring/fetch-ms-data"
import { updateMsInterval } from "@/lib/services/monitoring/update-ms"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { TimerResetIcon } from "lucide-react"

type Props = {
    msData : MsWithPatientWithWeight
}

export default function MsClInterval({ msData }: Props) {
    const [interval, setIntervalValue] = useState<number>(
        msData.interval_setting ?? 0
    )
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        if (msData.interval_setting !== null) {
            setIntervalValue(msData.interval_setting)
        }
    }, [msData.interval_setting])

    const handleIntervalChange = async () => {
        if (isNaN(interval)) {
            toast.error('올바른 숫자를 입력해주세요')
            setIntervalValue(msData.interval_setting ?? 0)
            return
        }

        if (interval === msData.interval_setting) return
        if (interval < 0) {
            toast.error('측정 간격은 0보다 커야 합니다')
            setIntervalValue(msData.interval_setting ?? 0)
            return
        }
        setIsUpdating(true)
        const success = await updateMsInterval(msData.session_id, interval)
        
        if (success) {
            toast.success('측정 간격이 변경되었습니다')
        } else {
            toast.error('측정 간격 변경에 실패하였습니다')
            setIntervalValue(msData.interval_setting ?? 0)
        }
        setIsUpdating(false)
    }

    return (
       <Button 
                size="default"
                variant="outline"
                className="flex w-40 items-center justify-start gap-2 px-2"
              >
            <TimerResetIcon size={16} className="shrink-0 text-muted-foreground" />
            
            <div className="flex flex-1 items-center gap-1 overflow-hidden">
                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    측정간격 :
                </span>
                
                <div className="flex items-center gap-0.5">
                    <Input
                        id="ms-interval"
                        type="number"
                        value={isNaN(interval) ? '' : interval}
                        onChange={(e) => {
                            const val = e.target.value
                            setIntervalValue(val === '' ? NaN : parseInt(val))
                        }}
                        onBlur={handleIntervalChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleIntervalChange()
                            }
                        }}
                        disabled={isUpdating}
                        className="h-6 w-11 border-none bg-transparent p-0 text-right text-sm font-semibold shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-medium text-muted-foreground">분</span>
                </div>
            </div>
        </Button>
    )
}