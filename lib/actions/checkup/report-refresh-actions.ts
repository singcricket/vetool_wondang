'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CheckupReportSection, CheckupReportImage } from '@/lib/services/checkup/fetch-checkup-report'

export async function refreshCheckupReportData(checkupId: string): Promise<{
  sections: CheckupReportSection[]
  images: CheckupReportImage[]
}> {
  const admin = createAdminClient() as any

  const [sectionsRes, imagesRes] = await Promise.all([
    admin
      .from('checkup_sections')
      .select('section_type, data')
      .eq('checkup_id', checkupId),
    admin
      .from('checkup_images')
      .select('id, img_url, tags, is_cover, img_memo, mark')
      .eq('checkup_id', checkupId),
  ])

  return {
    sections: (sectionsRes.data ?? []) as CheckupReportSection[],
    images: (imagesRes.data ?? []) as CheckupReportImage[],
  }
}
