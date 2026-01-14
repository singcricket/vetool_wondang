import { CSV_HEADER_MAPPING } from '@/constants/hospital/icu/patient/patient'
import {
  CANINE_BREEDS,
  FELINE_BREEDS,
} from '@/constants/hospital/register/signalments'

// Date를 다뤄야하는 경우가 있으므로 클라이언트 상에서 처리해야하므로 서버 컴포넌트가 아닌 유틸 함수화
export const transformCsvData = (
  row: string[],
  header: string[],
  uploadType: 'intoVet' | 'efriends',
) => {
  // 헤더를 트림하여 매칭 정확도 높임
  const trimmedHeader = header.map((h) =>
    h?.toString().trim().replace(/\s+/g, ''),
  )

  const hosPatientIdMapping = CSV_HEADER_MAPPING[uploadType].find(
    (mapping) => mapping.dbColumn === 'hos_patient_id',
  )
  const nameMapping = CSV_HEADER_MAPPING[uploadType].find(
    (mapping) => mapping.dbColumn === 'name',
  )

  const hosPatientIdIndex = hosPatientIdMapping
    ? trimmedHeader.indexOf(
        hosPatientIdMapping.csvColumn.trim().replace(/\s+/g, ''),
      )
    : -1
  const nameIndex = nameMapping
    ? trimmedHeader.indexOf(nameMapping.csvColumn.trim().replace(/\s+/g, ''))
    : -1

  // hos_patient_id 값이 없거나 빈 문자열인 경우 즉시 null 반환
  if (
    hosPatientIdIndex === -1 ||
    !row[hosPatientIdIndex] ||
    row[hosPatientIdIndex].toString().trim() === ''
  ) {
    return null
  }

  // 이름이 없는 경우도 null 반환
  if (
    nameIndex === -1 ||
    !row[nameIndex] ||
    row[nameIndex].toString().trim() === ''
  ) {
    return null
  }

  const transformedData: Record<string, any> = {}

  // Key: CSV COLUMN KOREAN 헤더!! ,Value: DB COLUMN NAME!!
  const columnIndexes = CSV_HEADER_MAPPING[uploadType]
    .map((mapping) => ({
      ...mapping,
      index: trimmedHeader.indexOf(
        mapping.csvColumn.trim().replace(/\s+/g, ''),
      ),
    }))
    .filter((mapping) => mapping.dbColumn && mapping.index !== -1)

  columnIndexes.forEach(({ index, dbColumn }) => {
    // CSV <-> DB 컬럼명에 대응되는 값
    const value = row[index]

    switch (dbColumn) {
      case 'birth':
        transformedData[dbColumn] = transformBirthDate(value)

        break

      case 'gender':
        transformedData[dbColumn] = transformGender(value)
        break

      case 'species':
        transformedData[dbColumn] = transformSpecies(value)

        break

      case 'breed':
        transformedData[dbColumn] = transformBreed(value)

        break

      case 'is_alive':
        transformedData[dbColumn] = transformIsAlive(value)
        break

      default:
        transformedData[dbColumn] = value
    }
  })

  // 필수 필드에 대한 기본값 설정 (DB Not-Null 제약 조건 준수)
  transformedData.species = transformedData.species ?? 'Unknown'
  transformedData.breed = transformedData.breed ?? 'MIXED'
  transformedData.gender = transformedData.gender ?? 'un'
  transformedData.birth =
    transformedData.birth ?? new Date().toISOString().split('T')[0]
  transformedData.is_alive = transformedData.is_alive ?? true

  return transformedData
}
const transformIsAlive = (value: string): boolean => {
  if (value === '사망' || value.toLowerCase() === 'false') {
    return false
  }

  return true
}

const transformGender = (value: string): string => {
  if (!value) return 'un'

  const normalizedValue = value.toString().trim().toLowerCase()

  const genderMap: Record<string, string> = {
    female: 'if',
    male: 'im',
    'castrated male': 'cm',
    'spayed female': 'sf',
    's.female': 'sf',
    'c.male': 'cm',
    암컷: 'if',
    수컷: 'im',
    '중성화 암컷': 'sf',
    '중성화 수컷': 'cm',
    fs: 'sf',
    mn: 'cm',
    f: 'if',
    m: 'im',
  }

  return genderMap[normalizedValue] ?? 'un'
}

const transformBirthDate = (value: string): string => {
  if (!value) return new Date().toISOString().split('T')[0]

  const stringValue = value.toString().trim().replace(/\./g, '-')

  // 1. 이미 YYYY-MM-DD 형식인 경우
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue
  }

  // 2. YY-MM-DD (8자리) 형식인 경우
  if (/^\d{2}-\d{2}-\d{2}$/.test(stringValue)) {
    const [year, month, day] = stringValue.split('-').map(Number)
    const fullYear = year > 90 ? 1900 + year : 2000 + year
    return `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  // 3. YYYYMMDD 형식인 경우
  if (/^\d{8}$/.test(stringValue)) {
    return `${stringValue.slice(0, 4)}-${stringValue.slice(4, 6)}-${stringValue.slice(6, 8)}`
  }

  const date = new Date(stringValue)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }

  return new Date().toISOString().split('T')[0]
}

const transformSpecies = (value: string) => {
  if (!value) return 'Unknown'

  const normalized = value.toString().trim().toLowerCase()

  if (
    normalized.includes('canine') ||
    normalized.includes('강아지') ||
    normalized.includes('개')
  ) {
    return 'canine'
  }
  if (normalized.includes('feline') || normalized.includes('고양이')) {
    return 'feline'
  }

  return 'Unknown'
}

const transformBreed = (value: string) => {
  if (!value || value.trim() === '') {
    return 'MIXED'
  }

  const normalized = value.toString().trim()
  const engPart = normalized.split('(')[0].trim().toLowerCase()

  // Korean Shorthaired -> Domestic Shorthaired 변환
  if (
    engPart.includes('korean') ||
    engPart.includes('코숏') ||
    engPart.includes('코리안')
  ) {
    return 'DOMESTIC SHORTHAIRED'
  }

  // breed 목록에서 매칭되는 eng value 찾기
  const matchedBreed = [...CANINE_BREEDS, ...FELINE_BREEDS]
    .find(
      (breed) =>
        breed.eng.toLowerCase() === engPart ||
        breed.kor.toLowerCase() === engPart ||
        normalized.includes(breed.kor),
    )
    ?.eng.toUpperCase()

  return (matchedBreed ?? normalized.toUpperCase()) || 'MIXED'
}
