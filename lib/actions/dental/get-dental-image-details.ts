'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDentalImageDetails(dentalImageId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dental_images')
    .select(`
      tooth_ids,
      other_tags,
      is_radio,
      dental_charts (
        species,
        patient_id,
        patients (
          species
        )
      )
    `)
    .eq('dental_image_id', dentalImageId)
    .single()

  if (error || !data) {
    return null
  }

  // Find species (chart level override or patient level)
  const chartRecord = Array.isArray(data.dental_charts) ? data.dental_charts[0] : data.dental_charts
  let species = 'canine'
  if (chartRecord) {
    species = chartRecord.species || chartRecord.patients?.species || 'canine'
  }

  return {
    tooth_ids: data.tooth_ids || [],
    other_tags: data.other_tags || [],
    is_radio: data.is_radio || false,
    species
  }
}
