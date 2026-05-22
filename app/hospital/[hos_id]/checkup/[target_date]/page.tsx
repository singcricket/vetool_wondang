export default function CheckupTargetDatePage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <div className="w-full max-w-md rounded-lg border border-dashed bg-slate-50 p-12">
        <h3 className="mb-2 text-lg font-medium text-slate-900">검진을 선택해주세요</h3>
        <p className="text-sm">
          좌측 사이드바에서 검진을 선택하거나,
          <br />새로운 검진을 등록해주세요.
        </p>
      </div>
    </div>
  )
}
