import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell,TableRow } from "@/components/ui/table"
import { VitalResults, VitalTimeSlot } from "@/types/monitoring/monitoring-type"
import { PlusIcon } from "lucide-react"
import { cn} from '@/lib/utils/utils'
import { useState, useTransition } from "react"
import { updateMsVitalResults } from "@/lib/services/monitoring/update-ms"
import MsClMinTimeInput from "./ms-cl-min-time-input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Props = {
    sessionId: string
    selectedVital : string[] | null
    vitalData : VitalResults | null
    clNames : string []
    startTime: string | null
    intervalSetting: number | null
}

export default function MsClTableCreateRow({sessionId, selectedVital, vitalData,clNames, startTime, intervalSetting}: Props) {
    const { refresh } = useRouter()
    const [minTimeInput, setMinTimeInput] = useState('')
    const [vitalValues, setVitalValues] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPending, startTransition] = useTransition()

    const selectedClNames : string[] = selectedVital && selectedVital.length>0 ? [...selectedVital] : [...clNames]

    const handleAddVital = async () => {
        if (!minTimeInput || isSubmitting) return

        // 중복 시간 기록 확인
        const isDuplicate = vitalData?.some(slot => slot.minTime === minTimeInput)
        if (isDuplicate) {
            toast.warning("동일한 시간의 기록이 있습니다")
            return
        }

        setIsSubmitting(true)

        const newTimeSlot: VitalTimeSlot = {
            create_timestamp: new Date().toISOString(),
            minTime: minTimeInput,
            vitals: selectedClNames.map(vitalName => ({
                vitalName,
                value: vitalValues[vitalName] || ''
            }))
        }

        const updatedResults = [...(vitalData || []), newTimeSlot]
        const success = await updateMsVitalResults(sessionId, updatedResults)

        if (success) {
            setMinTimeInput('')
            setVitalValues({})
            startTransition(() => {
                refresh()
            })
        }
        setIsSubmitting(false)
    }

    return(
        <TableRow className="hover:bg-transparent relative divide-x">
        <TableCell className="p-0" style={{ width: 128 }}>
        <div className="relative flex w-full items-center">
             <MsClMinTimeInput
                startTime={startTime}
                intervalSetting={intervalSetting}
                value={minTimeInput}
                onChange={setMinTimeInput}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddVital()
                    }
                }}
                disabled={isSubmitting}
              />
              <Button
                className="absolute right-2"
                size="icon"
                disabled={isSubmitting || !minTimeInput}
                onClick={handleAddVital}
                variant="ghost"
              >
                <PlusIcon />
              </Button>
        </div>
        </TableCell>
        {clNames.map((vital)=>{
            if(selectedClNames.includes(vital)){
            return(
               <TableCell  className="handle group p-0" key={vital}>
                 <div
                    className={cn('[&:focus-within_.tx-result-overlay]:opacity-50','relative [&:focus-within_.tx-result-overlay]:overflow-visible')}
                 >
                    <Input 
                        className="h-11 rounded-none border-none px-1 text-center ring-inset focus-visible:ring-1 bg-transparent" 
                        value={vitalValues[vital] || ''}
                        onChange={(e) => setVitalValues({...vitalValues, [vital]: e.target.value})}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddVital()
                            }
                        }}
                    />
                 </div>
               </TableCell >
                )
            }
            
        })}
        <TableCell className="p-0 text-center" />
        </TableRow>
    )
}