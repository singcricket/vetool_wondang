import MobileTitle from '@/components/common/mobile-title'
import SearchPatientContainer from '@/components/common/patients/search/search-patient-containter'
import { PawPrintIcon } from 'lucide-react'
import { Suspense } from 'react'

export default async function HospitalPatientsPage(
  props: PageProps<'/hospital/[hos_id]/patients'>,
) {
  const { hos_id } = await props.params

  return (
    <Suspense>
      <MobileTitle icon={PawPrintIcon} title="환자목록" />

      <SearchPatientContainer
        hosId={hos_id}
        isIcu={false}
        setIsIcuRegisterDialogOpen={undefined}
      />
    </Suspense>
  )
}
