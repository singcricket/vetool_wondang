export default function DentalTargetDatePage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground w-full">
      <div className="rounded-lg border bg-slate-50 border-dashed p-12 max-w-md w-full">
        <h3 className="text-lg font-medium text-slate-900 mb-2">환자를 선택해주세요</h3>
        <p className="text-sm">
          좌측 사이드바에서 치과 진료를 진행할 환자를 선택하거나,<br/>
          새로운 환자를 등록해주세요.
        </p>
      </div>
    </div>
  )
}
