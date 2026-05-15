export default function OncologyTargetDatePage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <div className="rounded-lg border bg-slate-50 border-dashed p-12 max-w-md w-full">
        <h3 className="text-lg font-medium text-slate-900 mb-2">케이스를 선택해주세요</h3>
        <p className="text-sm">
          좌측 사이드바에서 항암 케이스를 선택하거나,<br />
          새로운 케이스를 등록해주세요.
        </p>
      </div>
    </div>
  )
}
