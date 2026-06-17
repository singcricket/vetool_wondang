import DermSidebar from '@/components/hospital/derm/derm-sidebar/derm-sidebar'

interface Props {
  params: Promise<{ hos_id: string; target_date: string }>
  children?: React.ReactNode
}

export default async function DermDatePage({ params, children }: Props) {
  const { hos_id, target_date } = await params

  return (
    <div className="flex h-desktop">
      <DermSidebar hosId={hos_id} targetDate={target_date} />

      <div className="flex flex-1 flex-col items-center justify-center 2xl:ml-[200px] bg-slate-50">
        {children ?? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-700">피부과 차트 (Dermatology)</h2>
            <p className="mt-2 text-sm text-slate-500">
              환자를 선택하거나 새 피부과 차트를 등록해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
