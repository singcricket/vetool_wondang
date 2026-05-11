'use server'

import { createClient } from '@/lib/supabase/server'

export type PatientDashboardData = {
  icu: {
    icu_io_id: string
    in_date: string
    out_date: string | null
    diagnosis: string | null
  }[]
  monitoring: {
    session_id: string
    due_date: string
    session_title: string
  }[]
  ultrasound: {
    id: string
    chart_date: string
  }[]
  echo: {
    id: string
    exam_date: string
  }[]
  dental: {
    id: string
    chart_date: string
  }[]
  neuro: {
    id: string
    chart_date: string
  }[]
  ophthalmic: {
    id: string
    chart_date: string
  }[]
}

export async function fetchPatientDashboardData(patientId: string): Promise<PatientDashboardData> {
  const supabase = await createClient()

  const [icuRes, msRes, usRes, echoRes, dentalRes, neuroRes, ophthalmicRes] = await Promise.all([
    // ICU (icu_io)
    supabase
      .from('icu_io')
      .select('icu_io_id, in_date, out_date, icu_io_dx')
      .eq('patient_id', patientId)
      .order('in_date', { ascending: false }),

    // Monitoring Sessions
    supabase
      .from('monitoring_sessions')
      .select('session_id, due_date, session_title')
      .eq('patient_id', patientId)
      .order('due_date', { ascending: false }),

    // Ultrasound
    supabase
      .from('ultrasound_charts')
      .select('id, chart_date')
      .eq('patient_id', patientId)
      .order('chart_date', { ascending: false }),

    // Echo
    supabase
      .from('echo_charts')
      .select('id, exam_date')
      .eq('patient_id', patientId)
      .order('exam_date', { ascending: false }),

    // Dental
    supabase
      .from('dental_charts')
      .select('id, chart_date')
      .eq('patient_id', patientId)
      .order('chart_date', { ascending: false }),

    // Neuro
    supabase
      .from('neuro_charts')
      .select('id, chart_date')
      .eq('patient_id', patientId)
      .order('chart_date', { ascending: false }),

    // Ophthalmic
    supabase
      .from('ophthalmic_charts')
      .select('id, chart_date')
      .eq('patient_id', patientId)
      .order('chart_date', { ascending: false }),
  ])

  return {
    icu: (icuRes.data ?? []).map(item => ({
      icu_io_id: item.icu_io_id,
      in_date: item.in_date,
      out_date: item.out_date,
      diagnosis: item.icu_io_dx,
    })),
    monitoring: msRes.data ?? [],
    ultrasound: usRes.data ?? [],
    echo: echoRes.data ?? [],
    dental: dentalRes.data ?? [],
    neuro: neuroRes.data ?? [],
    ophthalmic: ophthalmicRes.data ?? [],
  }
}
