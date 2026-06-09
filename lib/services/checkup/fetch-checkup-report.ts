import { createAdminClient } from '@/lib/supabase/admin'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'

export type CheckupReportSection = {
  section_type: string
  data: Record<string, unknown>
}

export type CheckupReportImage = {
  id: string
  img_url: string
  tags: string[]
  is_cover: boolean
}

export type CheckupReportData = {
  record: {
    id: string
    checkup_date: string
    vet_name: string | null
    hospital_name: string
    patient: {
      name: string
      species: string
      breed: string | null
      gender: string | null
      birth: string | null
      hos_patient_id: string
      owner_name: string | null
    }
  }
  sections: CheckupReportSection[]
  images: CheckupReportImage[]
}

export async function fetchCheckupReportAdmin(checkupId: string): Promise<CheckupReportData> {
  const admin = createAdminClient() as any

  const { data: record, error } = await admin
    .from('checkup_records')
    .select(`
      id, hos_id, checkup_date, vet_id,
      patients!inner(name, species, breed, hos_patient_id, birth, gender, owner_name)
    `)
    .eq('id', checkupId)
    .single()

  if (error || !record) throw new Error('검진 기록을 찾을 수 없습니다.')

  const [sectionsRes, imagesRes, hospitalRes, vetRes] = await Promise.all([
    admin.from('checkup_sections').select('section_type, data').eq('checkup_id', checkupId),
    admin.from('checkup_images').select('id, img_url, tags, is_cover').eq('checkup_id', checkupId),
    admin.from('hospitals').select('name').eq('id', record.hos_id).single(),
    record.vet_id
      ? admin.from('users').select('name').eq('user_id', record.vet_id).single()
      : Promise.resolve({ data: null }),
  ])

  const p = record.patients

  return {
    record: {
      id: record.id,
      checkup_date: record.checkup_date,
      vet_name: vetRes.data?.name ?? null,
      hospital_name: hospitalRes.data?.name ?? '',
      patient: {
        name: p?.name ?? '',
        species: p?.species ?? '',
        breed: p?.breed ?? null,
        gender: p?.gender ?? null,
        birth: p?.birth ?? null,
        hos_patient_id: p?.hos_patient_id ?? '',
        owner_name: p?.owner_name ?? null,
      },
    },
    sections: (sectionsRes.data ?? []) as CheckupReportSection[],
    images: (imagesRes.data ?? []) as CheckupReportImage[],
  }
}
