import { z } from 'zod'

export const scheduleSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().optional(),
  location: z.string().optional(),
  is_all_day: z.boolean().default(false),
  start_time: z.date(),
  end_time: z.date(),
  target_users: z.string().optional(), // 콤마로 구분된 문자열
  color: z.string().optional(),
  category: z.string().optional(),
})

export type ScheduleFormValues = z.infer<typeof scheduleSchema>
