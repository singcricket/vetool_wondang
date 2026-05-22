import { neuroReference } from '@/constants/hospital/physical-exam/neuro/neuro_ref'

export function generateNeuroReportText(
  results: Record<string, string | string[]>,
  localisations: Record<string, any>,
  patient?: { name?: string; species?: string; breed?: string; gender?: string; birth?: string } | null,
  chartDate?: string,
): string {
  const {
    localisationCandidates: candidates = [],
    detectedSyndromes: syndromes = [],
    cerebralLateralisation = null,
  } = localisations

  let report = `[신경학적 검사 리포트]\n`
  if (patient) {
    report += `환자명: ${patient.name || '-'}\n`
    report += `품종: ${patient.species === 'cat' ? '고양이' : '개'} / ${patient.breed || '-'}\n`
    report += `성별/나이: ${patient.gender === 'male' ? '수컷' : '암컷'} / ${patient.birth || '-'}\n`
  }
  if (chartDate) report += `검사일: ${chartDate}\n`
  report += `----------------------------------------\n\n`

  report += `[검사 소견]\n`

  neuroReference.domainSections.forEach((section) => {
    const sectionResults: string[] = []

    section.tests.forEach((test) => {
      const val = results[test.testID]
      if (val === undefined || val === null || val === '') return

      let displayValue = ''
      if (test.testType === 'select' || test.testType === 'grade') {
        const options =
          (test as any).options ||
          (test as any).grades?.map((g: any) => ({
            value: String(g.grade),
            label: g.label,
            labelKo: g.labelKo,
          }))
        const opt = options?.find((o: any) => o.value === val)
        displayValue = opt ? `${opt.labelKo} (${opt.label})` : String(val)
      } else if (test.testType === 'multiselect' && Array.isArray(val)) {
        const options = (test as any).options
        displayValue = val
          .map((v) => {
            const opt = options.find((o: any) => o.value === v)
            return opt ? `${opt.labelKo} (${opt.label})` : v
          })
          .join(', ')
      } else if (test.testType === 'boolean') {
        const t = test as any
        displayValue =
          val === 'true'
            ? `${t.positiveResultTextKo} (${t.positiveResultText})`
            : `${t.negativeResultTextKo} (${t.negativeResultText})`
      } else {
        displayValue = String(val)
      }

      sectionResults.push(`- ${test.testNameKo} (${test.testName}): ${displayValue}`)
    })

    if (sectionResults.length > 0) {
      report += `<${section.domainNameKo}>\n`
      report += sectionResults.join('\n') + '\n\n'
    }
  })

  report += `----------------------------------------\n`
  report += `[종합 분석 결과]\n`

  if (syndromes.length > 0) {
    report += `\n<감지된 증후군>\n`
    syndromes.forEach((syn: any) => {
      report += `• ${syn.nameKo}: ${syn.interpretationKo}\n`
    })
  }

  if (candidates.length > 0) {
    report += `\n<예상 병변 위치>\n`
    candidates.forEach((loc: any) => {
      report += `• ${loc.locationNameKo || loc.location} (${loc.confidenceScore}% 매치)\n`
    })
  }

  if (cerebralLateralisation && cerebralLateralisation.hemisphere !== 'undetermined') {
    report += `\n<대뇌 반구 편측화>\n`
    const side =
      cerebralLateralisation.hemisphere === 'left'
        ? '좌측'
        : cerebralLateralisation.hemisphere === 'right'
          ? '우측'
          : '양측성'
    report += `• ${side} 반구 병변 의심 (${cerebralLateralisation.confidenceScore}% 신뢰도)\n`
    report += `  근거: ${cerebralLateralisation.summaryKo?.split('\n')[1] || ''}\n`
  }

  return report.trim()
}
