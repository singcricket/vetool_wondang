'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import {
  getPatientData,
  type PatientWithWeight,
} from '@/lib/services/patient/patient'
import { CalculatorIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import CalculatorSheetContentsDynamic from './calculator-sheet-contents-dynamic'
import { fetchMsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'

export default function CalculatorSheet() {
  const { patient_id } = useParams()
  const { session_id } = useParams()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithWeight | null>(null)

  const fetchPatientData = async () => {
    setIsFetching(true)

    if (patient_id) {
      const patientData = await getPatientData(patient_id as string)
      setPatientData(patientData)
    }
    else if(session_id){
      const msPatientData = await fetchMsWithPatientWithWeight(session_id as string)
const patientData = await getPatientData(msPatientData.patient?.patient_id as string)
      
      setPatientData(patientData)
    

//       patient
// : 
// {name: '올리', birth: '2024-08-15', breed: 'AMERICAN SHORTHAIR', gender: 'sf', species: 'feline', …}
// vital
// : 
// {created_at: '2026-03-12T15:32:57.6181+00:00', body_weight: '5'}

      msPatientData.patient && setPatientData(patientData)
    }

    setIsFetching(false)
    setIsSheetOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchPatientData()
    } else {
      setIsSheetOpen(false)
      setPatientData(null)
    }
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
      {/* <NewFeature className="right-1 top-1"> */}
      <SheetTrigger asChild>
        <Button size="icon" className="mr-1 h-8 w-8 rounded-full 2xl:mr-0">
          {isFetching ? <Spinner /> : <CalculatorIcon />}
        </Button>
      </SheetTrigger>
      {/* </NewFeature> */}

      <CalculatorSheetContentsDynamic
        patientData={patientData}
        setIsSheetOpen={setIsSheetOpen}
      />
    </Sheet>
  )
}

