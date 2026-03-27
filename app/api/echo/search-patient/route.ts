import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hosId = searchParams.get('hos_id')
  const q = searchParams.get('q')

  if (!hosId || !q) {
    return NextResponse.json([])
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patients')
    .select(
      'patient_id, name, species, breed, gender, birth, hos_patient_id, hos_owner_id, owner_name',
    )
    .eq('hos_id', hosId)
    .eq('is_alive', true)
    .or(
      `name.ilike.%${q}%,hos_patient_id.ilike.%${q}%,breed.ilike.%${q}%`,
    )
    .limit(20)

  if (error) {
    return NextResponse.json([], { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
