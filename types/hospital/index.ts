import { Hospital, User } from '@/types'

export type AdditionalStaff = {
  id: string
  name: string
  position: string
  group: string
  address?: string
  phone?: string
  join_date?: string
  memo?: string
}

export type ScheduleSetting = {
  additional_staffs: AdditionalStaff[]
}

export type ParsedError = {
  name?: string
  message: string
  stack?: string
  digest?: string
  errorUrl?: string
}
