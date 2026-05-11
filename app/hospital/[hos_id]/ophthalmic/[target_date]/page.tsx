import { Eye } from 'lucide-react'

export default function OphthalmicDatePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-slate-50/50">
      <div className="rounded-full bg-white p-6 shadow-sm mb-4">
        <Eye className="h-12 w-12 text-slate-300" />
      </div>
      <h3 className="text-lg font-medium text-slate-600">안과 검사 차트</h3>
      <p className="text-sm">왼쪽 사이드바에서 환자를 선택하거나 새 차트를 등록해주세요.</p>
    </div>
  )
}
