import type {Patient } from '@/types'

export type MsVetSub = {
  primary: string // 집도의 name
  secondary : string // 보조의(assistant) name
  anesthesia: string // 마취의 name
  other: string // 기타 name
}

export type MsPatient = Omit<
  Patient,
  'hos_id' | 'created_at' | 'owner_id'
> & {
  body_weight: string | null
  weight_measured_date: string | null
}


export type MsMemo = 
    { 
  index:string
  memo:string
  check:string
  create_timestamp:string
  color: string
  is_done:boolean
  is_realtime_memo:boolean
  done_timestamp:string
  chosen:boolean
}
export type MsMemoTx = MsMemo[] | []