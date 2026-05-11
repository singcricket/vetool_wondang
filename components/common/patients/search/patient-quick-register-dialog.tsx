'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PlusIcon, LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'
import type { Patient } from '@/types'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { registerIcu } from '@/lib/services/icu/register-icu'
import { registerMonitoringSession } from '@/lib/services/monitoring/ms-register'
import { registerEchoChart } from '@/lib/services/echocardio/register-echo'
import { registerDentalChart } from '@/lib/services/dental/register-dental'
import { registerUltrasoundChart } from '@/lib/services/ultrasound/register-ultrasound'
import { registerNeuroChart } from '@/lib/services/neuro/register-neuro'
import { registerOphthalmicChart } from '@/lib/services/ophthalmic/register-ophthalmic'
import { useRouter } from 'next/navigation'

type Props = {
  patient: Patient
  hosId: string
}

type ServiceType = 'icu' | 'monitoring' | 'echocardio' | 'dental' | 'ultrasound' | 'neuro' | 'ophthalmic'

const SERVICES: { id: ServiceType; label: string; color: string }[] = [
  { id: 'icu', label: '입원 (ICU)', color: 'text-rose-500' },
  { id: 'monitoring', label: '모니터링', color: 'text-amber-500' },
  { id: 'echocardio', label: '심장초음파', color: 'text-red-500' },
  { id: 'dental', label: '치과', color: 'text-blue-500' },
  { id: 'ultrasound', label: '복부초음파', color: 'text-emerald-500' },
  { id: 'neuro', label: '신경계', color: 'text-indigo-500' },
  { id: 'ophthalmic', label: '안과', color: 'text-sky-500' },
]

export default function PatientQuickRegisterDialog({ patient, hosId }: Props) {
  const { push } = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleService = (id: ServiceType) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const handleRegister = async () => {
    if (selectedServices.length === 0) {
      toast.error('등록할 차트를 선택해주세요.')
      return
    }

    setIsSubmitting(true)
    const targetDate = format(new Date(), 'yyyy-MM-dd')
    const results: { label: string; id: string; type: ServiceType }[] = []
    const errors: string[] = []

    for (const serviceId of selectedServices) {
      try {
        let chartId = ''
        switch (serviceId) {
          case 'icu':
            await registerIcu(hosId, patient.patient_id, patient.birth, targetDate)
            results.push({ label: '입원', id: '', type: 'icu' }) // ICU doesn't return ID easily in this service
            break
          case 'monitoring':
            const ageDays = Math.floor(
              (Date.now() - new Date(patient.birth).getTime()) / (1000 * 60 * 60 * 24),
            )
            const tags = `#${patient.hos_patient_id}#${patient.hos_owner_id ?? ''}#${patient.name}#${patient.species}#${patient.breed}#${patient.gender}#${ageDays}`
            chartId = await registerMonitoringSession(hosId, targetDate, patient.patient_id, patient.birth, tags)
            results.push({ label: '모니터링', id: chartId, type: 'monitoring' })
            break
          case 'echocardio':
            chartId = await registerEchoChart({
              hosId,
              patientId: patient.patient_id,
              examDate: targetDate,
              patient: {
                hos_patient_id: patient.hos_patient_id,
                hos_owner_id: patient.hos_owner_id ?? null,
                name: patient.name,
                species: patient.species,
                breed: patient.breed,
                gender: patient.gender,
                birth: patient.birth,
              },
            })
            results.push({ label: '심장초음파', id: chartId, type: 'echocardio' })
            break
          case 'dental':
            chartId = await registerDentalChart({
              hosId,
              patientId: patient.patient_id,
              chartDate: targetDate,
              patient: {
                hos_patient_id: patient.hos_patient_id,
                hos_owner_id: patient.hos_owner_id ?? null,
                name: patient.name,
                species: patient.species,
                breed: patient.breed,
                gender: patient.gender,
                birth: patient.birth,
              },
            })
            results.push({ label: '치과', id: chartId, type: 'dental' })
            break
          case 'ultrasound':
            chartId = await registerUltrasoundChart({
              hosId,
              patientId: patient.patient_id,
              targetDate,
              vetId: null,
            })
            results.push({ label: '복부초음파', id: chartId, type: 'ultrasound' })
            break
          case 'neuro':
            chartId = await registerNeuroChart({
              hosId,
              patientId: patient.patient_id,
              targetDate,
            })
            results.push({ label: '신경계', id: chartId, type: 'neuro' })
            break
          case 'ophthalmic':
            chartId = await registerOphthalmicChart({
              hosId,
              patientId: patient.patient_id,
              targetDate,
            })
            results.push({ label: '안과', id: chartId, type: 'ophthalmic' })
            break
        }
      } catch (e: any) {
        errors.push(`${SERVICES.find(s => s.id === serviceId)?.label}: ${e.message}`)
      }
    }

    setIsSubmitting(false)
    if (errors.length > 0) {
      toast.error('일부 차트 등록에 실패했습니다.', {
        description: errors.join('\n'),
      })
    }

    if (results.length > 0) {
      toast.success('차트 등록이 완료되었습니다.', {
        description: (
          <div className="flex flex-wrap gap-2 mt-2">
            {results.map((res, i) => {
              const href =
                res.type === 'icu'
                  ? `/hospital/${hosId}/icu`
                  : `/hospital/${hosId}/${res.type}/${format(new Date(), 'yyyy-MM-dd')}/${res.id}`

              return (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => push(href as any)}
                >
                  {res.label} 바로가기
                </Button>
              )
            })}
          </div>
        ),
        duration: 5000,
      })
      setOpen(false)
      setSelectedServices([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <PlusIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{patient.name} - 신규 차트 등록</DialogTitle>
          <DialogDescription>
            오늘({format(new Date(), 'yyyy-MM-dd')})자로 등록할 차트를 모두 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => toggleService(service.id)}
            >
              <div className="flex items-center space-x-3 pointer-events-none">
                <Checkbox
                  id={service.id}
                  checked={selectedServices.includes(service.id)}
                />
                <Label
                  className={`flex-1 text-sm font-semibold ${service.color}`}
                >
                  {service.label}
                </Label>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleRegister}
            disabled={isSubmitting || selectedServices.length === 0}
          >
            {isSubmitting ? (
              <>
                <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              '등록하기'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
