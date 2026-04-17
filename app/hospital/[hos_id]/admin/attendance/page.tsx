import AttendanceClient from '@/components/hospital/admin/attendance/attendance-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ hos_id: string }>
}) {
  const { hos_id } = await params
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  return (
    <div className="p-4 md:p-6 w-full h-full flex flex-col pt-[72px]">
      <AttendanceClient hosId={hos_id} loggedInUserId={authUser.id} />
    </div>
  )
}
