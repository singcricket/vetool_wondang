export function parseDoseMgPerKg(comment: string): number | null {
  const m = comment.match(/(\d+\.?\d*)\s*mg\/kg/i)
  return m ? parseFloat(m[1]) : null
}

export function rewriteCommentWithVolume(
  comment: string,
  weightKg: number,
  concMgPerMl: number,
): string {
  const doseMatch = comment.match(/(\d+\.?\d*)\s*mg\/kg/i)
  if (!doseMatch) return comment

  const doseMgKg = parseFloat(doseMatch[1])
  const totalMg   = Math.round(doseMgKg * weightKg * 100) / 100
  const volumeMl  = Math.round((totalMg / concMgPerMl) * 100) / 100

  const replaced = comment.replace(
    /약?\s*\d+\.?\d*\s*mg(?!\/(?:kg|ml))/i,
    `${totalMg}mg ÷ ${concMgPerMl}mg/ml = ${volumeMl}ml`,
  )

  if (replaced === comment) {
    return `${comment.trimEnd()}. 체중 ${weightKg}kg → ${totalMg}mg ÷ ${concMgPerMl}mg/ml = ${volumeMl}ml`
  }
  return replaced
}
