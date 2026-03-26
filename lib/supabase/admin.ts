import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// 관리자 권한 클라이언트 (RLS 정책 우회) - 서버 사이드에서만 안전하게 사용해야 합니다.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
