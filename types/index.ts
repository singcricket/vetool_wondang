import type { Database } from '@/lib/supabase/database.types'

export type Patient = Database['public']['Tables']['patients']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type IcuIo = Database['public']['Tables']['icu_io']['Row']
export type Hospital = Database['public']['Tables']['hospitals']['Row']
export type UserApproval = Database['public']['Tables']['user_approvals']['Row']
export type Notice = Database['public']['Tables']['notices']['Row']
// export type IcuNotification =
//   Database['public']['Tables']['icu_notification']['Row']
export type Todo = Database['public']['Tables']['todos']['Row']
export type IcuChart = Database['public']['Tables']['icu_charts']['Row']
export type IcuOrders = Database['public']['Tables']['icu_orders']['Row']
export type IcuTxs = Database['public']['Tables']['icu_txs']['Row']
export type IcuTemplate = Database['public']['Tables']['icu_templates']['Row']
// export type VetoolErrors = Database['public']['Tables']['vetool_errors']['Row']
export type VetoolFeedbacks =
  Database['public']['Tables']['vetool_feedbacks']['Row']
export type Announcements = Database['public']['Tables']['announcements']['Row']
// export type DrugProductsRows =
//   Database['public']['Tables']['drug_products']['Row']
// export type DrugDoses = Database['public']['Tables']['drug_doses']['Row']
export type RawDrug = Database['public']['Tables']['raw_drugs']['Row']
export type HosDrug = Database['public']['Tables']['hos_drugs']['Row']
export type Diet = Database['public']['Tables']['diets']['Row']
export type Vitals = Database['public']['Tables']['vitals']['Row']
export type MonitoringSession = Database['public']['Tables']['monitoring_sessions']['Row']

// is_vet 이 true인 경우에만 사용하는 user
export type Vet = Pick<
  User,
  'name' | 'position' | 'user_id' | 'avatar_url' | 'rank'
>

export type SupabaseClaims = {
  iss: string
  sub: string
  aud: string
  exp: number
  iat: number
  email: string
  phone: string
  app_metadata: {
    provider: string
    providers: string[]
  }
  user_metadata: {
    avatar_url: string
    email: string
    email_verified: boolean
    full_name: string
    iss: string
    name: string
    phone_verified: boolean
    picture: string
    provider_id: string
    sub: string
  }
  role: string
  aal: string
  amr: {
    method: string
    timestamp: number
  }[]
  session_id: string
  is_anonymous: boolean
}
