import PatientRegisterDialog from '@/components/common/patients/form/patient-register-dialog'
import UploadExcelDialog from '@/components/common/patients/upload/upload-excel-dialog'

export default function RegisterPatientButton({ hosId }: { hosId: string }) {
  return (
    <div className="hidden items-center gap-1 2xl:mr-0 2xl:flex">
      <PatientRegisterDialog hosId={hosId} />

      <UploadExcelDialog hosId={hosId} />
    </div>
  )
}
