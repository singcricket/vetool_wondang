'use client'

import DataTable from '@/components/ui/data-table'
import type { OncologySidebarItem } from '@/types/hospital/oncology-type'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

type Props = {
  cases: OncologySidebarItem[]
  hosId: string
}

function useOncologyCasesColumns(hosId: string): ColumnDef<OncologySidebarItem>[] {
  const router = useRouter()

  return [
    {
      accessorKey: 'patient_name',
      header: '환자명',
    },
    {
      accessorKey: 'hos_patient_id',
      header: 'ID',
    },
    {
      accessorKey: 'diagnosis_name',
      header: '진단명',
    },
    {
      accessorKey: 'status',
      header: '상태',
      cell: ({ row }) => {
        const map: Record<string, string> = {
          active: '치료중',
          completed: '완료',
          discontinued: '중단',
          deceased: '사망',
        }
        return map[row.original.status] ?? row.original.status
      },
    },
    {
      accessorKey: 'case_date',
      header: '등록일',
      cell: ({ row }) => format(row.original.case_date, 'yyyy-MM-dd'),
    },
    {
      accessorKey: 'vet_name',
      header: '담당의',
      cell: ({ row }) => row.original.vet_name ?? '미지정',
    },
    {
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() =>
            router.push(`/hospital/${hosId}/oncology/${row.original.case_date}/${row.original.id}`)
          }
          className="rounded bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-700"
        >
          보기
        </button>
      ),
    },
  ]
}

export default function OncologySearchEntry({ cases, hosId }: Props) {
  const columns = useOncologyCasesColumns(hosId)

  return (
    <div className="p-2">
      <DataTable
        searchPlaceHolder="환자 이름, 진단명으로 검색"
        data={cases}
        columns={columns}
        rowLength={10}
      />
    </div>
  )
}
