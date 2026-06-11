export type LifeStage = 'puppy' | 'junior' | 'adult' | 'senior' | 'geriatric'

export function calcLifeStage(birth: string | null, species: string): LifeStage {
  if (!birth) return 'adult'
  const months =
    (new Date().getFullYear() - new Date(birth).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(birth).getMonth())

  const isCat = /^(cat|feline)$/i.test(species)
  if (isCat) {
    if (months < 12)  return 'puppy'
    if (months < 24)  return 'junior'
    if (months < 84)  return 'adult'
    if (months < 132) return 'senior'
    return 'geriatric'
  } else {
    if (months < 12)  return 'puppy'
    if (months < 36)  return 'junior'
    if (months < 84)  return 'adult'
    if (months < 120) return 'senior'
    return 'geriatric'
  }
}
