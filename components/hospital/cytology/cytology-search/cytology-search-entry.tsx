'use client'

import DataTable from '@/components/ui/data-table'
import type { CytologySidebarItem } from '@/lib/services/cytology/fetch-cytology'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

const SAMPLE_TYPE_LABELS: Record<string, string> = {
  otic: '귀도말',
  skin_impression: '피부 인상도말',
  skin_exudate: '피부 삼출물',
  fecal: '분변염색',
  vaginal: '질 세포진',
  conjunctival: '결막/각막 도말',
  fna_skin: 'FNA - 피부/피하',
  fna_lymph: 'FNA - 림프절',
  fna_organ: 'FNA - 내부 장기',
  effusion: '체강액',
  synovial: '관절액',
  csf: '뇌척수액',
  bal: '기관지폐포세척액',
}

type Props = {
  charts: CytologySidebarItem[]
  hosId: string
}

function useCytologyChartsColumns(hosId: string): ColumnDef<CytologySidebarItem>[] {
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
      accessorKey: 'sample_type',
      header: '검체 종류',
      cell: ({ row }) => SAMPLE_TYPE_LABELS[row.original.sample_type] ?? row.original.sample_type,
    },
    {
      accessorKey: 'chart_date',
      header: '검사일',
      cell: ({ row }) => format(row.original.chart_date, 'yyyy-MM-dd'),
    },
    {
      accessorKey: 'evaluator_name',
      header: '판독자',
      cell: ({ row }) => row.original.evaluator_name ?? '미지정',
    },
    {
      accessorKey: 'mode',
      header: '모드',
      cell: ({ row }) => row.original.mode === 'ai' ? 'AI' : '전문의',
    },
    {
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() =>
            router.push(
              `/hospital/${hosId}/cytology/${row.original.chart_date}/${row.original.id}`,
            )
          }
          className="rounded bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-700"
        >
          보기
        </button>
      ),
    },
  ]
}

export default function CytologySearchEntry({ charts, hosId }: Props) {
  const columns = useCytologyChartsColumns(hosId)

  return (
    <div className="p-2">
      <DataTable
        searchPlaceHolder="환자 이름, 검체 종류로 검색"
        data={charts}
        columns={columns}
        rowLength={10}
      />
    </div>
  )
}
