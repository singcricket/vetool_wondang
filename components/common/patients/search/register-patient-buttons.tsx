import PatientRegisterDialog from '@/components/common/patients/form/patient-register-dialog'
import UploadExcelDialog from '@/components/common/patients/upload/upload-excel-dialog'
import PatientOcrSheet from '@/components/common/patients/upload/patient-ocr-sheet'

export default function RegisterPatientButton({ hosId }: { hosId: string }) {
  return (
    <div className="hidden items-center gap-1 2xl:mr-0 2xl:flex">
      <PatientOcrSheet hosId={hosId} />

      <PatientRegisterDialog hosId={hosId} />

      <UploadExcelDialog hosId={hosId} />
    </div>
  )
}
