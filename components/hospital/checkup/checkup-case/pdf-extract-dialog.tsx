'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  extractCheckupFromPdf,
  type FileInput,
  type PdfExtractionResult,
} from '@/lib/actions/checkup/pdf-extraction'

interface Props {
  checkupId: string
  hosId: string
  onApply: (result: PdfExtractionResult) => void
}

export default function PdfExtractDialog({ checkupId, hosId, onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<FileInput[]>([])
  const [extracting, setExtracting] = useState(false)
  const [result, setResult] = useState<PdfExtractionResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return

    const converted: FileInput[] = await Promise.all(
      selected.map(
        (file) =>
          new Promise<FileInput>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1]
              resolve({ base64, mediaType: file.type, fileName: file.name })
            }
            reader.readAsDataURL(file)
          }),
      ),
    )
    setFiles((prev) => [...prev, ...converted].slice(0, 5))
  }

  const handleExtract = async () => {
    if (files.length === 0) {
      toast.error('파일을 먼저 선택해주세요.')
      return
    }
    try {
      setExtracting(true)
      setResult(null)
      const extracted = await extractCheckupFromPdf(checkupId, hosId, files)
      setResult(extracted)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '추출 중 오류가 발생했습니다.')
    } finally {
      setExtracting(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    onApply(result)
    setOpen(false)
    setFiles([])
    setResult(null)
    toast.success('데이터가 적용되었습니다. 확인 후 저장해주세요.')
  }

  const handleClose = () => {
    setOpen(false)
    setFiles([])
    setResult(null)
  }

  // 추출 항목 카운트
  const inquiryCount = result
    ? Object.values(result.inquiry).filter((v) => v.trim()).length
    : 0
  const physicalCount = result
    ? Object.values(result.physical).filter((v) => v.trim()).length
    : 0

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-teal-400 text-teal-700 hover:bg-teal-50"
        onClick={() => setOpen(true)}
      >
        <FileText className="mr-1 h-4 w-4" />
        PDF AI 추출
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>PDF AI 추출</DialogTitle>
            <DialogDescription>
              병원 검사 결과지 PDF를 업로드하면 AI가 검사 수치, 문진, 신체검사 항목을 자동으로 추출합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {/* 파일 업로드 영역 */}
            <div
              className="cursor-pointer rounded-lg border-2 border-dashed border-slate-200 p-6 text-center hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-600">PDF 또는 이미지 파일을 클릭하여 선택</p>
              <p className="mt-1 text-xs text-slate-400">최대 5개 파일 (PDF, JPG, PNG)</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
            </div>

            {/* 선택된 파일 목록 */}
            {files.length > 0 && (
              <div className="flex flex-col gap-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 shrink-0 text-teal-600" />
                      <span className="truncate text-slate-700">{f.fileName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="ml-2 shrink-0 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 추출 버튼 */}
            <Button
              onClick={handleExtract}
              disabled={extracting || files.length === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Sparkles className="mr-1 h-4 w-4" />
              {extracting ? 'AI 분석 중...' : 'AI 추출 시작'}
            </Button>

            {/* 추출 결과 미리보기 */}
            {result && (
              <div className="flex flex-col gap-3 rounded-lg border border-teal-200 bg-teal-50/30 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-800">추출 완료 — 내용 확인 후 적용하세요</span>
                </div>

                {/* 문진 */}
                {inquiryCount > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-600">
                      문진 ({inquiryCount}개 항목 추출)
                    </p>
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      {result.inquiry.chief_complaint && (
                        <div><span className="font-medium">주증상: </span>{result.inquiry.chief_complaint}</div>
                      )}
                      {result.inquiry.history && (
                        <div><span className="font-medium">병력: </span>{result.inquiry.history}</div>
                      )}
                      {result.inquiry.living_env && (
                        <div><span className="font-medium">생활환경: </span>{result.inquiry.living_env}</div>
                      )}
                      {result.inquiry.current_medications && (
                        <div><span className="font-medium">약물: </span>{result.inquiry.current_medications}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 신체검사 수치 */}
                {physicalCount > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-600">
                      신체검사 수치 ({physicalCount}개)
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {result.physical.body_weight && <Badge variant="outline">체중 {result.physical.body_weight} kg</Badge>}
                      {result.physical.temperature && <Badge variant="outline">체온 {result.physical.temperature} °C</Badge>}
                      {result.physical.pulse && <Badge variant="outline">맥박 {result.physical.pulse}</Badge>}
                      {result.physical.respiration && <Badge variant="outline">호흡 {result.physical.respiration}</Badge>}
                      {result.physical.bcs && <Badge variant="outline">BCS {result.physical.bcs}</Badge>}
                    </div>
                  </div>
                )}

                {/* 검사 수치 */}
                {result.lab_items.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-600">
                      검사 수치 ({result.lab_items.length}개 항목 매핑됨)
                    </p>
                    <div className="max-h-[160px] overflow-y-auto rounded border bg-white">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr className="border-b text-slate-500">
                            <th className="px-2 py-1 text-left font-medium">항목</th>
                            <th className="px-2 py-1 text-left font-medium">값</th>
                            <th className="px-2 py-1 text-left font-medium">단위</th>
                            <th className="px-2 py-1 text-left font-medium">참고범위</th>
                            <th className="px-2 py-1 text-left font-medium">판정</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {result.lab_items.map((item) => (
                            <tr key={item.id} className={item.is_abnormal ? 'bg-red-50' : ''}>
                              <td className="px-2 py-1 font-medium">{item.nameEn}</td>
                              <td className="px-2 py-1">{item.value ?? '—'}</td>
                              <td className="px-2 py-1 text-slate-400">{item.unit}</td>
                              <td className="px-2 py-1 text-slate-400">{item.ref_range ?? '—'}</td>
                              <td className="px-2 py-1">
                                {item.is_abnormal === true && (
                                  <span className="rounded bg-red-100 px-1 text-red-600">이상</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 매핑 실패 항목 */}
                {result.unmatched_lab.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {result.unmatched_lab.length}개 항목은 ref 파일에 없어 미적용:&nbsp;
                      {result.unmatched_lab.map((u) => u.nameEn).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleClose}>취소</Button>
            {result && (
              <Button onClick={handleApply} className="bg-teal-600 hover:bg-teal-700">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                검진 데이터에 적용
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
