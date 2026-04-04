export type Schedule = {
  id: string
  hos_id: string
  created_by: string | null
  title: string
  content: string | null
  location: string | null
  start_time: string // ISO 8601 string
  end_time: string // ISO 8601 string
  is_all_day: boolean
  target_users: string[]
  color: string | null
  category: string | null
  created_at: string
  updated_at: string
}

export type NewSchedule = Omit<Schedule, 'id' | 'created_at' | 'updated_at'>
