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
  img_memo: string | null
  mark: Record<string, unknown> | null
}

export type HosInfo = {
  address?: string
  phone?: string
  hours?: string
  tagline?: string
}

export type CheckupReportData = {
  record: {
    id: string
    checkup_date: string
    vet_name: string | null
    hospital_name: string
    hos_info: HosInfo | null
    subCharts: Record<string, string | null>
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
      id, hos_id, checkup_date, vet_id, sub_charts,
      patients!inner(name, species, breed, hos_patient_id, birth, gender, owner_name)
    `)
    .eq('id', checkupId)
    .single()

  if (error || !record) throw new Error('검진 기록을 찾을 수 없습니다.')

  const [sectionsRes, imagesRes, hospitalRes, vetRes] = await Promise.all([
    admin.from('checkup_sections').select('section_type, data').eq('checkup_id', checkupId),
    admin.from('checkup_images').select('id, img_url, tags, is_cover, img_memo, mark').eq('checkup_id', checkupId),
    admin.from('hospitals').select('name, hos_info').eq('hos_id', record.hos_id).single(),
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
      hos_info: (hospitalRes.data?.hos_info as HosInfo) ?? null,
      subCharts: ((record.sub_charts as Record<string, string | null>) ?? {}),
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
