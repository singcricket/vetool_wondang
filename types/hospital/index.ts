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

export type TimeTemplate = {
  id: string
  name: string
  title?: string
  category?: string
  is_all_day?: boolean
  start_time: string
  end_time: string
}

export type ScheduleCategory = {
  id: string
  name: string
  color: string
  start_time?: string
  end_time?: string
}

export type ScheduleSetting = {
  additional_staffs: AdditionalStaff[]
  time_templates?: TimeTemplate[]
  schedule_categories?: ScheduleCategory[]
  hidden_categories?: ScheduleCategory[]
}

export type ParsedError = {
  name?: string
  message: string
  stack?: string
  digest?: string
  errorUrl?: string
}
