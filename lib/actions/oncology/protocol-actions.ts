'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DrugItem } from './ai-oncology-guide'

function calcBSA(weightKg: number, species: string): number {
  if (species === 'cat' || species === '고양이') {
    return 0.100 * Math.pow(weightKg, 0.667)
  }
  // default: dog
  return 0.101 * Math.pow(weightKg, 0.667)
}

const DRUG_ROUTE_MAP: Record<string, string> = {
  oral: 'oral', po: 'oral', 'per os': 'oral', 'per oral': 'oral',
  iv: 'iv', intravenous: 'iv', 'i.v.': 'iv', 'iv infusion': 'iv',
  sc: 'sc', subcutaneous: 'sc', 'sub-q': 'sc', 'sub-cutaneous': 'sc',
  im: 'im', intramuscular: 'im', 'i.m.': 'im',
}

function normalizeRoute(route: string): string {
  return DRUG_ROUTE_MAP[route?.toLowerCase()] ?? 'iv'
}

function frequencyToDays(freq: string): number {
  const map: Record<string, number> = {
    q7d: 7,
    q14d: 14,
    q21d: 21,
    q28d: 28,
    q35d: 35,
    q42d: 42,
    q24h: 1,
    q48h: 2,
  }
  return map[freq] ?? 7
}

function calcDose(drug: DrugItem, weightKg: number, species: string): number | null {
  if (!drug.dose_value) return null
  if (drug.dose_unit === 'mg/m2') {
    const bsa = calcBSA(weightKg, species)
    return Math.round(drug.dose_value * bsa * 100) / 100
  }
  if (drug.dose_unit === 'mg/kg') {
    return Math.round(drug.dose_value * weightKg * 100) / 100
  }
  if (drug.dose_unit === 'fixed_mg') {
    return drug.dose_value
  }
  return Math.round(drug.dose_value * weightKg * 100) / 100
}

export async function createCaseProtocol(
  caseId: string,
  protocolId: string,
  bodyWeight: number,
  startDate: string,
) {
  const supabase = await createClient()

  // Fetch protocol details
  const { data: protocol, error: protocolError } = await supabase
    .from('onco_protocols')
    .select('*')
    .eq('id', protocolId)
    .single()

  if (protocolError) throw new Error(`프로토콜 조회 실패: ${protocolError.message}`)

  // Fetch case details (for species)
  const { data: caseData, error: caseError } = await supabase
    .from('onco_cases')
    .select('patient_id, patients(species)')
    .eq('id', caseId)
    .single()

  if (caseError) throw new Error(`케이스 조회 실패: ${caseError.message}`)

  const species = (caseData as any).patients?.species ?? 'dog'

  const drugs = (protocol.drugs as DrugItem[]) ?? []
  const totalCycles = Math.max(protocol.total_cycles ?? 1, 1)
  const totalWeeks = Math.max(protocol.total_weeks ?? 1, 1)
  const totalDurationDays = totalWeeks * 7

  // Cycle length = total duration / number of cycles (e.g. 25 weeks / 6 cycles ≈ 28 days/cycle)
  const cycleLengthDays = Math.round(totalDurationDays / totalCycles)

  type ScheduleRow = {
    case_protocol_id: string
    drug_name: string
    drug_route: string
    cycle_number: number
    day_number: number
    scheduled_date: string
    dose_calculated: number | null
    dose_per_kg: number | null
    dose_per_m2: number | null
    dose_unit: string
    status: string
  }

  const scheduleInserts: ScheduleRow[] = []
  const start = new Date(startDate)

  for (const drug of drugs) {
    const freqDays = frequencyToDays(drug.frequency)
    const startDayOffset = Math.max((drug.cycle_day ?? 1) - 1, 0)
    // duration_days > 1: multi-day oral course (e.g. prednisolone 7 days/cycle)
    const courseDays = (drug.duration_days ?? 1) > 1 ? (drug.duration_days ?? 1) : 1
    const dose = calcDose(drug, bodyWeight, species)
    const dosePerKg = drug.dose_unit === 'mg/kg' ? drug.dose_value : null
    const dosePerM2 = drug.dose_unit === 'mg/m2' ? drug.dose_value : null

    // Label suffix for home-dosed oral drugs
    const freqLabel: Record<string, string> = {
      q24h: '매일', q48h: '격일(EOD)', q7d: '주1회',
    }

    // Home-dosed oral: q24h / q48h / multi-day course → single dispensing entry per cycle
    // (owner gives at home; vet just needs to dispense/confirm at each cycle visit)
    const isHomeDosed = drug.is_oral && (courseDays > 1 || freqDays <= 2)

    if (isHomeDosed) {
      const label = courseDays > 1
        ? `${drug.drug_name} (${courseDays}일)`
        : `${drug.drug_name} (${freqLabel[drug.frequency] ?? drug.frequency})`

      for (let c = 1; c <= totalCycles; c++) {
        const cycleStart = (c - 1) * cycleLengthDays
        const dayOffset = cycleStart + startDayOffset
        if (dayOffset >= totalDurationDays) break
        const schedDate = new Date(start)
        schedDate.setDate(start.getDate() + dayOffset)
        scheduleInserts.push({
          case_protocol_id: '',
          drug_name: label,
          drug_route: normalizeRoute(drug.route),
          cycle_number: c,
          day_number: startDayOffset + 1,
          scheduled_date: schedDate.toISOString().split('T')[0],
          dose_calculated: dose,
          dose_per_kg: dosePerKg,
          dose_per_m2: dosePerM2,
          dose_unit: drug.dose_unit,
          status: 'scheduled',
        })
      }
    } else {
      // Single-dose or infrequent oral drug: individual entry per administration
      // Cycle number = which protocol cycle this date falls into
      let dayOffset = startDayOffset
      while (dayOffset < totalDurationDays) {
        const cycleNumber = Math.min(Math.floor(dayOffset / cycleLengthDays) + 1, totalCycles)
        const dayInCycle = (dayOffset % cycleLengthDays) + 1
        const schedDate = new Date(start)
        schedDate.setDate(start.getDate() + dayOffset)
        scheduleInserts.push({
          case_protocol_id: '',
          drug_name: drug.drug_name,
          drug_route: normalizeRoute(drug.route),
          cycle_number: cycleNumber,
          day_number: dayInCycle,
          scheduled_date: schedDate.toISOString().split('T')[0],
          dose_calculated: dose,
          dose_per_kg: dosePerKg,
          dose_per_m2: dosePerM2,
          dose_unit: drug.dose_unit,
          status: 'scheduled',
        })
        dayOffset += freqDays
        if (scheduleInserts.length >= 500) break
      }
    }
  }

  const totalDoses = scheduleInserts.length

  // Create case protocol row
  const { data: caseProtocol, error: cpError } = await supabase
    .from('onco_case_protocols')
    .insert({
      case_id: caseId,
      protocol_id: protocolId,
      initial_body_weight: bodyWeight,
      start_date: startDate,
      status: 'active',
      total_doses: totalDoses,
      completed_doses: 0,
      delayed_doses: 0,
      reduced_doses: 0,
    })
    .select('id')
    .single()

  if (cpError) throw new Error(`케이스 프로토콜 생성 실패: ${cpError.message}`)

  // Insert schedules
  const schedulesWithId = scheduleInserts.map((s) => ({
    ...s,
    case_protocol_id: caseProtocol.id,
  }))

  if (schedulesWithId.length > 0) {
    const { error: schedError } = await supabase.from('onco_schedules').insert(schedulesWithId)
    if (schedError) throw new Error(`스케줄 생성 실패: ${schedError.message}`)
  }

  revalidatePath('/', 'layout')
  return caseProtocol.id
}

export async function deleteCaseProtocol(caseProtocolId: string) {
  const supabase = await createClient()

  // schedules are cascade-deleted via FK, but delete explicitly for safety
  await supabase.from('onco_schedules').delete().eq('case_protocol_id', caseProtocolId)

  const { error } = await supabase
    .from('onco_case_protocols')
    .delete()
    .eq('id', caseProtocolId)

  if (error) throw new Error(`프로토콜 삭제 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

export async function updateCaseProtocolStatus(caseProtocolId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('onco_case_protocols')
    .update({ status })
    .eq('id', caseProtocolId)

  if (error) throw new Error(`상태 업데이트 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}

export async function updateCaseProtocolNotes(caseProtocolId: string, notes: string | null) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('onco_case_protocols')
    .update({ notes })
    .eq('id', caseProtocolId)

  if (error) throw new Error(`노트 업데이트 실패: ${error.message}`)

  revalidatePath('/', 'layout')
}
