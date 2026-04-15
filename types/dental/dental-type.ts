export type DentalChart = {
  id: string
  hos_id: string
  patient_id: string
  vet_id: string | null
  chart_date: string
  memo?: string | null
  general_note?: string | null
  anesthesia?: boolean | null
  created_at: string
  updated_at: string
}

export type DentalChartWithPatient = DentalChart & {
  patient: {
    name: string
    species: string
    breed: string
    hos_patient_id: string
    birth: string
    gender: string
    owner_name: string | null
    hos_owner_id: string | null
    microchip_no: string | null
    memo: string | null
  }
  vet?: { name: string; user_id: string } | null
}

export type DentalSidebarItem = {
  id: string
  patient_id: string
  chart_date: string
  patient_name: string
  species: string
  breed: string
  hos_patient_id: string
  vet_name: string | null
}
