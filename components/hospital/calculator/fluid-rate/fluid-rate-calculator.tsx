import MaintenanceTab from '@/components/hospital/calculator/fluid-rate/maintenance/maintenance-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PatientWithWeight } from '@/lib/services/patient/patient'
import { useState } from 'react'
import RehydrationTab from './rehydration/rehydration-tab'
import ResuscitationTab from './resuscitation/resuscitation-tab'

type Props = {
  patientData: PatientWithWeight | null
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function FluidRateCalculator({
  patientData,
  setIsSheetOpen,
}: Props) {
  const [tab, setTab] = useState('maintenance')
  const [localWeight, setLocalWeight] = useState(
    patientData?.vital?.body_weight ?? '',
  )
  const handleLocalWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalWeight(e.target.value)
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="rehydration">Rehydration</TabsTrigger>
        <TabsTrigger value="resusitation">Resuscitation</TabsTrigger>
      </TabsList>

      <TabsContent value="maintenance" className="px-2">
        <MaintenanceTab
          weight={localWeight}
          species={patientData?.patient.species}
          handleLocalWeightChange={handleLocalWeightChange}
          setIsSheetOpen={setIsSheetOpen}
        />
      </TabsContent>

      <TabsContent value="rehydration" className="px-2">
        <RehydrationTab
          weight={localWeight}
          handleLocalWeightChange={handleLocalWeightChange}
          setIsSheetOpen={setIsSheetOpen}
        />
      </TabsContent>

      <TabsContent value="resusitation" className="px-2">
        <ResuscitationTab
          species={patientData?.patient.species}
          weight={localWeight}
          handleLocalWeightChange={handleLocalWeightChange}
          setIsSheetOpen={setIsSheetOpen}
        />
      </TabsContent>
    </Tabs>
  )
}
