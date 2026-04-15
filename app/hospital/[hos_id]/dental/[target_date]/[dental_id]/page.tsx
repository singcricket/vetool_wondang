export default async function DentalChartPage(props: {
  params: Promise<{ hos_id: string; target_date: string; dental_id: string }>
}) {
  const params = await props.params
  
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <span className="text-2xl">🦷</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">치과 차트 준비 중</h2>
        <p className="text-slate-500 text-sm">
          차트 ID: <span className="font-mono text-xs bg-slate-50 px-1 py-0.5 rounded border">{params.dental_id}</span>
        </p>
        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-4">입력 폼 개발 예정</p>
          <div className="grid grid-cols-2 gap-3 opacity-40 grayscale pointer-events-none">
            <div className="h-20 bg-slate-100 rounded-md animate-pulse"></div>
            <div className="h-20 bg-slate-100 rounded-md animate-pulse"></div>
            <div className="h-32 col-span-2 bg-slate-100 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
