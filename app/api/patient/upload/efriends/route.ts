// app/api/patient/upload/route.ts

import { createClient } from '@/lib/supabase/server'
import { transformCsvData } from '@/lib/utils/insert-patient'
import type { Patient } from '@/types'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { data, hos_id } = await req.json()
    // 헤더 행 탐색 (보토 1행이지만 가변적일 수 있음)
    let headerIndex = 0
    let header = data[headerIndex]

    if (!header || !header.some((h: any) => h?.toString().includes('보호자'))) {
      headerIndex = 1
      header = data[headerIndex]
    }

    const patientData = data
      .slice(headerIndex + 1)
      .map((row: string[]) => {
        const transformedRow = transformCsvData(row, header, 'efriends')
        if (transformedRow) {
          return { ...transformedRow, hos_id }
        }
        return null
      })
      .filter((row: any): row is NonNullable<typeof row> => {
        return !!(row && row.hos_patient_id && row.name)
      })

    const uniquePatientData: any = Array.from(
      new Map(
        patientData.map((item: Patient) => [
          `${item.hos_patient_id}-${item.birth}-${item.name}`,
          item,
        ]),
      ).values(),
    )

    if (uniquePatientData.length === 0) {
      return NextResponse.json(
        { error: '유효한 데이터가 없습니다.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('patients')
      .upsert(uniquePatientData, {
        onConflict: 'hos_patient_id, birth, name',
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('업로드 처리 중 오류:', error)
    const message = error instanceof Error ? error.message : '업로드 처리 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
