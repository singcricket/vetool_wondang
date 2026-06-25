export type BlogPostStatus = 'draft' | 'published' | 'archived'
export type BlogSpecies = 'canine' | 'feline' | 'exotic' | 'etc'

export const BLOG_CATEGORIES = [
  '외과', '안과', '치과', '내과', '소화기', '심혈관계','신경계','호흡기','간담췌',
  '내분비','비뇨기','생식기','근골격계','피부과', '종양','정형외과','신경외과','일반외과','응급','영상','기타'
] as const
export type BlogCategory = typeof BLOG_CATEGORIES[number]

export const IMAGE_TAGS = [
  '썸네일','증상','진단', '치료', '병변', '혈액검사','임상병리검사','초음파검사','방사선검사','요검사','약물치료','입원치료','수술','시술'
] as const

export const THUMBNAIL_TAG = '썸네일' as const
export type ImageTag = typeof IMAGE_TAGS[number]

export const SPECIES_LABEL: Record<BlogSpecies, string> = {
  canine: '개',
  feline: '고양이',
  exotic: '특수동물',
  etc: '기타',
}

export const STATUS_LABEL: Record<BlogPostStatus, string> = {
  draft: '임시저장',
  published: '발행',
  archived: '보관',
}

export const STATUS_COLOR: Record<BlogPostStatus, string> = {
  draft: 'bg-slate-100 text-slate-500',
  published: 'bg-teal-50 text-teal-700',
  archived: 'bg-amber-50 text-amber-600',
}

// 섹션 대상 독자
export type SectionAudience = 'vet' | 'owner' | 'both'

export const AUDIENCE_LABEL: Record<SectionAudience, string> = {
  vet: '수의사',
  owner: '보호자',
  both: '공통',
}

export const AUDIENCE_COLOR: Record<SectionAudience, string> = {
  vet: 'bg-violet-50 text-violet-700 border-violet-200',
  owner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  both: 'bg-slate-100 text-slate-500 border-slate-200',
}

// content JSONB 섹션 타입
export type BlogSection =
  | { type: 'section'; title: string; body: string; audience?: SectionAudience }
  | { type: 'image_row'; image_ids: string[] }
  | { type: 'disease_info'; title: string; body: string; audience?: SectionAudience }

export type BlogImage = {
  id: string
  blog_post_id: string
  hos_id: string
  image_url: string
  tags: string[]
  caption: string | null
  order_index: number
  created_at: string
}

export type BlogPatient = {
  patient_id: string
  name: string
  species: string
  breed: string
  gender: string
  birth: string
  hos_patient_id: string
  is_alive: boolean
  owner_name: string | null
}

export type BlogPost = {
  id: string
  hos_id: string
  created_by: string | null
  title: string
  status: BlogPostStatus
  case_category: string
  diagnosis: string | null
  species: BlogSpecies | null
  summary: string | null
  user_tags: string | null
  tags: string | null
  patient_id: string | null
  content: BlogSection[]
  cover_image_url: string | null
  pdf_url: string | null
  blood_test_data: BlogLabData | null
  created_at: string
  updated_at: string
  published_at: string | null
  // joined
  images?: BlogImage[]
  patient?: BlogPatient | null
}

export type { LabResultItem } from '@/constants/hospital/checkup/lab-types'
import type { LabResultItem } from '@/constants/hospital/checkup/lab-types'

export type BlogLabSession = {
  date: string       // "YYYY-MM-DD", 날짜 미상이면 빈 문자열
  label?: string     // "입원 1일차", "퇴원 전" 등 선택 설명
  items: LabResultItem[]
}

export type BlogLabData = BlogLabSession[]
export type BloodTestData = BlogLabData

export type BlogPostFormInput = {
  title: string
  case_category: string
  diagnosis: string
  species: BlogSpecies | ''
  summary: string
  user_tags: string
  content: BlogSection[]
  cover_image_url: string
  extra_notes: string  // AI에 전달할 추가 지시사항 (DB 저장 안 함)
}
