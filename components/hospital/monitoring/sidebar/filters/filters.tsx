'use client'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import type { Vet } from '@/types'
import { RotateCcwIcon } from 'lucide-react'
import GroupFilter from './group-filter'
import SortFilter from './sort-filter'
import VetFilter from './vet-filter'
import { MonitoringSidebarData } from '@/lib/services/monitoring/fetch-ms-data'

type Props = {
  hosGroupList: string[]
  vetList: Vet[]
  filters: FilterState
  setFilters: (value: FilterState) => void
}

export default function Filters({
  hosGroupList,
  vetList,
  filters,
  setFilters,
}: Props) {
  return (
    <ButtonGroup className="flex w-full">
      <GroupFilter
        hosGroupList={hosGroupList}
        filters={filters}
        setFilters={setFilters}
      />

      <VetFilter vetList={vetList} filters={filters} setFilters={setFilters} />

      <SortFilter filters={filters} setFilters={setFilters} />

      <Button
        size="sm"
        variant="outline"
        className="flex-1 px-2 focus-visible:ring-0"
        onClick={() => setFilters(DEFAULT_MS_FILTER_STATE)}
      >
        <RotateCcwIcon />
      </Button>
    </ButtonGroup>
  )
}

export const SORT_MS_FILTER_ITEMS = [
  { label: '시작시간순', value: 'date' },
  { label: '수의사순', value: 'vet' },
  { label: '가나다순', value: 'name' }
] as const

export type SortFilterValue = (typeof SORT_MS_FILTER_ITEMS)[number]['value']

export type FilterState = {
  selectedGroup: string
  selectedVet: string
  selectedSort: SortFilterValue
}

export const DEFAULT_MS_FILTER_STATE: FilterState = {
  selectedGroup: '',
  selectedVet: '',
  selectedSort: 'date',
}


export const filterPatients = (
  data: MonitoringSidebarData[],
  filters: FilterState,
  vetsListData: Vet[],
): FilteredMsData => {
  const { selectedGroup, selectedVet, selectedSort } = filters

  // === 종료 / 미종료 먼저 분리 ===
  const inPatients = data.filter((list) => !list.end_time)
  const dischargedPatients = data.filter((list) => list.end_time)

  // === 필터링: 미종료 환자만 대상으로 ===
  let filtered = inPatients.filter((item) => {
    const inGroup = !selectedGroup || item.session_group?.includes(selectedGroup)

    const byVet =
      !selectedVet ||
      item.vet_main === selectedVet 

    return inGroup && byVet
  })

  // === 정렬 준비 ===
  const rankMap = Object.fromEntries(
    vetsListData.map((vet) => [vet.user_id, vet.rank]),
  )

  const sorters: Record<
    SortFilterValue,
    (a: MonitoringSidebarData, b: MonitoringSidebarData) => number
  > = {
    vet: (a, b) =>
      (rankMap[a.vet_main ?? ''] ?? 99) -
      (rankMap[b.vet_main ?? ''] ?? 99),
    name: (a, b) =>
      (a.patient?.name ?? '').localeCompare(b.patient?.name ?? '', 'ko'),
    date: (a, b) => {
      if (!a.start_time && !b.start_time) return 0
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return a.start_time.localeCompare(b.start_time)
    },
  }

  // === 정렬 적용 ===
  if (selectedSort in sorters) {
    filtered.sort(sorters[selectedSort])
  }

  // === 제외된 환자 (미퇴원 중에서만) ===
  const filteredSet = new Set(filtered.map((p) => p.session_id))
  const excludedMsData = inPatients.filter(
    (p) => !filteredSet.has(p.session_id),
  )

  // === 퇴원환자 (정렬도 동일하게 적용) ===
  let outMsData = [...dischargedPatients]
  if (selectedSort in sorters) {
    outMsData.sort(sorters[selectedSort])
  }

  return {
    filteredMsData: filtered, // 조건 + 정렬 + 미퇴원
    excludedMsData, // 조건 불일치 + 미퇴원
    outMsData, // 조건과 무관하게 모든 퇴원환자
  }
}

export type FilteredMsData = {
  filteredMsData: MonitoringSidebarData[]
  excludedMsData: MonitoringSidebarData[]
  outMsData: MonitoringSidebarData[]
}

export type FilterMsState = {
  selectedGroup: string
  selectedVet: string
  selectedSort: SortFilterValue
}