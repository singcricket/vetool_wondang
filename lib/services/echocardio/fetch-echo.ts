'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  EchoChartWithPatient,
  EchoChartDetail,
  EchoSidebarItem,
  EchoTemplate,
  EchoTemplateGuideImage,
  Species,
} from '@/types/echocardio/echocardio-type'
import { DEFAULT_SECTION_ORDER } from '@/constants/hospital/echocardio/echo-sections'
import { ITEMS_BY_SECTION } from '@/constants/hospital/echocardio/echo-tests'

// =============================================
// 사이드바 차트 목록 조회 (날짜 기준)
// =============================================
export async function fetchEchoSidebarData(
  hosId: string,
  targetDate: string,
): Promise<EchoSidebarItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('echo_charts')
    .select(
      `
      id,
      patient_id,
      exam_date,
      vet_id,
      examiner_id,
      patients!inner(name, species, breed, hos_patient_id),
      vet:users!echo_charts_vet_id_fkey(name, user_id),
      examiner:users!echo_charts_examiner_id_fkey(name, user_id)
    `,
    )
    .eq('hos_id', hosId)
    .eq('exam_date', targetDate)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`fetchEchoSidebarData: ${error.message}`)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    patient_id: row.patient_id,
    exam_date: row.exam_date,
    patient_name: row.patients?.name ?? '',
    species: row.patients?.species ?? '',
    breed: row.patients?.breed ?? '',
    hos_patient_id: row.patients?.hos_patient_id ?? '',
    vet_name: row.vet?.name ?? null,
    examiner_name: row.examiner?.name ?? null,
  }))
}

// =============================================
// 차트 상세 조회 (결과값 포함)
// =============================================
export async function fetchEchoChartDetail(
  echoId: string,
): Promise<EchoChartDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('echo_charts')
    .select(
      `
      *,
      patients!inner(name, species, breed, hos_patient_id, birth, gender, owner_name, hos_owner_id, microchip_no, memo),
      vet:users!echo_charts_vet_id_fkey(name, user_id),
      examiner:users!echo_charts_examiner_id_fkey(name, user_id),
      echo_results(*)
    `,
    )
    .eq('id', echoId)
    .single()

  if (error) return null

  const row: any = data
  return {
    ...row,
    patient: row.patients,
    vet: row.vet ?? null,
    examiner: row.examiner ?? null,
    results: row.echo_results ?? [],
  }
}

// =============================================
// 활성 템플릿 조회 (is_default=true, 없으면 기본값 반환)
// =============================================
export async function fetchActiveTemplate(
  hosId: string,
  species: Species = 'canine',
): Promise<EchoTemplate> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('echo_templates')
    .select('*')
    .eq('hos_id', hosId)
    .eq('template_species', species)
    .eq('is_default', true)
    .single()

  if (!data) {
    const defaultActiveItems = Object.fromEntries(
      Object.entries(ITEMS_BY_SECTION).map(([section, items]) => [
        section,
        (items as any[])
          .filter((i) => i.species?.includes(species))
          .map((i) => i.keywordID),
      ]),
    )
    return {
      id: '',
      hos_id: hosId,
      name: `기본 템플릿 (${species === 'feline' ? '고양이' : '개'})`,
      template_species: species,
      description: null,
      section_order: DEFAULT_SECTION_ORDER,
      item_order: {},
      active_items: defaultActiveItems,
      is_default: true,
      display_order: 0,
      created_at: '',
      updated_at: '',
    }
  }

  return data as unknown as EchoTemplate
}

// 하위 호환
export const fetchEchoSettings = fetchActiveTemplate

// =============================================
// 전체 템플릿 목록 조회
// =============================================
export async function fetchEchoTemplates(
  hosId: string,
): Promise<EchoTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('echo_templates')
    .select('*')
    .eq('hos_id', hosId)
    .order('display_order', { ascending: true })

  if (error) throw new Error(`fetchEchoTemplates: ${error.message}`)
  return (data ?? []) as unknown as EchoTemplate[]
}

// =============================================
// 활성 템플릿의 가이드 이미지 조회
// =============================================
export async function fetchActiveTemplateGuideImages(
  hosId: string,
  species?: Species,
): Promise<EchoTemplateGuideImage[]> {
  const supabase = await createClient()

  let query = supabase
    .from('echo_templates')
    .select('id')
    .eq('hos_id', hosId)
    .eq('is_default', true)

  if (species) {
    query = query.eq('template_species', species)
  }

  const { data: templates } = await query.limit(1)
  const template = templates?.[0]

  if (!template) return []

  const { data, error } = await supabase
    .from('echo_template_guide_images')
    .select('*')
    .eq('template_id', template.id)
    .order('display_order', { ascending: true })

  if (error) throw new Error(`fetchActiveTemplateGuideImages: ${error.message}`)
  return (data ?? []) as unknown as EchoTemplateGuideImage[]
}

// 하위 호환
export const fetchEchoGuideImages = fetchActiveTemplateGuideImages

// =============================================
// 특정 템플릿의 가이드 이미지 조회
// =============================================
export async function fetchTemplateGuideImages(
  templateId: string,
): Promise<EchoTemplateGuideImage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('echo_template_guide_images')
    .select('*')
    .eq('template_id', templateId)
    .order('display_order', { ascending: true })
  if (error) throw new Error(`fetchTemplateGuideImages: ${error.message}`)
  return (data ?? []) as unknown as EchoTemplateGuideImage[]
}

// =============================================
// 환자의 이전 차트 목록 조회 (비교용)
// =============================================
export async function fetchPatientEchoHistory(
  patientId: string,
  excludeEchoId?: string,
): Promise<EchoChartDetail[]> {
  const supabase = await createClient()

  let query = supabase
    .from('echo_charts')
    .select(
      `
      *,
      patients!inner(name, species, breed, hos_patient_id, birth, gender),
      vet:users!echo_charts_vet_id_fkey(name, user_id),
      examiner:users!echo_charts_examiner_id_fkey(name, user_id),
      echo_results(*)
    `,
    )
    .eq('patient_id', patientId)
    .order('exam_date', { ascending: false })

  if (excludeEchoId) {
    query = query.neq('id', excludeEchoId)
  }

  const { data, error } = await query
  if (error) throw new Error(`fetchPatientEchoHistory: ${error.message}`)

  return (data ?? []).map((row: any) => ({
    ...row,
    patient: row.patients,
    vet: row.vet ?? null,
    examiner: row.examiner ?? null,
    results: row.echo_results ?? [],
  }))
}
