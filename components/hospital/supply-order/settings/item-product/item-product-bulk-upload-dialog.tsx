'use client'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet, LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { bulkCreateItemProducts } from '@/lib/actions/supply-order/item-product-actions'
import type { ItemProductCsvRow, Vendor } from '@/types/hospital/supply-order-type'

const COLUMNS = [
  {
    key: 'brand_name',
    label: '제품명',
    required: true,
    description: '브랜드·상품명 (JW 생리식염수 500mL)',
    example: 'JW 생리식염수 500mL',
  },
  {
    key: 'manufacturer',
    label: '제조사',
    required: false,
    description: '제조사명',
    example: 'JW중외제약',
  },
  {
    key: 'specification',
    label: '규격',
    required: false,
    description: '용량·함량 등 규격',
    example: '500mL',
  },
  {
    key: 'ingredient',
    label: '성분명',
    required: false,
    description: '세부 성분명 (선택)',
    example: 'NaCl 0.9%',
  },
  {
    key: 'package_type',
    label: '포장단위',
    required: false,
    description: '낱개 / 박스 / 케이스 / 팩 등. 미입력 시 "낱개"',
    example: '박스',
  },
  {
    key: 'units_per_package',
    label: '포장당수량',
    required: false,
    description: '포장 1개당 기준단위 수량. 미입력 시 1',
    example: '100',
  },
  {
    key: 'reference_price',
    label: '기준단가',
    required: false,
    description: '원 단위 숫자만. 참고값',
    example: '1500',
  },
  {
    key: 'memo',
    label: '메모',
    required: false,
    description: '기타 메모',
    example: '',
  },
] as const

function downloadSampleFile() {
  const headers = COLUMNS.map((c) => c.key)
  const sample = [
    ['JW 생리식염수 500mL', 'JW중외제약', '500mL', 'NaCl 0.9%', '박스', '100', '1500', ''],
    ['바이엘 메트로니다졸 주 0.5%', '바이엘코리아', '100mL/바이알', 'Metronidazole 0.5%', '낱개', '1', '3200', ''],
    ['아목시실린 캡슐 250mg', '한미약품', '250mg', 'Amoxicillin', '병', '100', '850', ''],
    ['BD 주사기 5mL', 'BD', '5mL', '', '박스', '100', '120', '5cc 루어락'],
    ['헤파린 생리식염수 10mL', '대한약품', '10mL', 'Heparin 10U/mL', '낱개', '1', '', ''],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample])
  ws['!cols'] = headers.map(() => ({ wch: 22 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '제품목록')
  XLSX.writeFile(wb, 'item_products_sample.xlsx')
}

function parseFile(file: File): Promise<ItemProductCsvRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '', raw: false })
        resolve(rows as ItemProductCsvRow[])
      } catch {
        reject(new Error('파일을 읽을 수 없습니다.'))
      }
    }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsArrayBuffer(file)
  })
}

interface Props {
  hosId: string
  vendors: Pick<Vendor, 'id' | 'name'>[]
}
type UploadState = 'idle' | 'preview' | 'uploading' | 'done'

export default function ItemProductBulkUploadDialog({ hosId, vendors }: Props) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<UploadState>('idle')
  const [rows, setRows] = useState<ItemProductCsvRow[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [result, setResult] = useState<{ success: number; errors: { row: number; message: string }[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseFile(file)
      if (parsed.length === 0) { toast.error('데이터가 없습니다.'); return }
      setRows(parsed)
      setState('preview')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '파일 파싱 실패')
    }
    e.target.value = ''
  }

  const handleUpload = async () => {
    try {
      setState('uploading')
      const plainRows = rows.map((row) => {
        const r: Record<string, string> = {}
        for (const col of COLUMNS) {
          r[col.key] = String((row as any)[col.key] ?? '')
        }
        return r as unknown as typeof rows[number]
      })
      const res = await bulkCreateItemProducts(hosId, plainRows, selectedVendorId || undefined)
      setResult(res)
      setState('done')
      if (res.success > 0) toast.success(`${res.success}개 제품이 등록되었습니다.`)
      if (res.errors.length > 0) toast.warning(`${res.errors.length}개 행에 오류가 있습니다.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드 실패')
      setState('preview')
    }
  }

  const reset = () => { setState('idle'); setRows([]); setResult(null); setSelectedVendorId('') }
  const handleOpenChange = (v: boolean) => { setOpen(v); if (!v) reset() }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Upload size={13} />
          대량 업로드
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle className="text-base">제품 대량 업로드</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">

          {state === 'idle' && (
            <div className="flex flex-col gap-5 p-5">

              {/* 도매상 선택 */}
              {vendors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-600">
                    공급 도매상 <span className="font-normal text-slate-400">(선택 시 AI 매칭 우선순위에 활용됩니다)</span>
                  </p>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus:ring-1 focus:ring-teal-400"
                  >
                    <option value="">도매상 선택 (선택사항)</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 안내 */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <LinkIcon size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="text-xs text-amber-700">
                  <p className="font-semibold">품목 마스터 연결은 업로드 후 개별 수정에서 진행합니다.</p>
                  <p className="mt-0.5 text-amber-600">제품 정보만 먼저 일괄 등록 후, 제품 목록에서 각 제품을 클릭해 품목 마스터를 연결하세요.</p>
                </div>
              </div>

              {/* 컬럼 가이드 */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">파일 컬럼 명세</p>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={downloadSampleFile}>
                    <Download size={12} />
                    샘플 파일 다운로드
                  </Button>
                </div>
                <p className="mb-3 text-xs text-slate-500">
                  Excel(.xlsx) 또는 CSV(.csv) 파일의 <strong>첫 행은 반드시 아래 영문 컬럼명</strong>과 일치해야 합니다.
                </p>
                <div className="overflow-hidden rounded border">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border-b px-3 py-2 text-left font-semibold text-slate-600">컬럼명 (헤더)</th>
                        <th className="border-b px-3 py-2 text-left font-semibold text-slate-600">한글명</th>
                        <th className="border-b px-3 py-2 text-left font-semibold text-slate-600">필수</th>
                        <th className="border-b px-3 py-2 text-left font-semibold text-slate-600">설명 / 예시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COLUMNS.map((col, i) => (
                        <tr key={col.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="border-b px-3 py-2 font-mono font-semibold text-teal-700">{col.key}</td>
                          <td className="border-b px-3 py-2 text-slate-700">{col.label}</td>
                          <td className="border-b px-3 py-2">
                            {col.required
                              ? <span className="font-semibold text-rose-500">필수</span>
                              : <span className="text-slate-400">선택</span>}
                          </td>
                          <td className="border-b px-3 py-2 text-slate-500">
                            <div>{col.description}</div>
                            {col.example && <div className="mt-0.5 font-mono text-slate-400">예) {col.example}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 파일 선택 */}
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-8 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
                onClick={() => fileRef.current?.click()}
              >
                <FileSpreadsheet size={32} className="text-slate-300" />
                <p className="text-sm text-slate-500">Excel 또는 CSV 파일을 선택하세요</p>
                <p className="text-xs text-slate-400">.xlsx / .xls / .csv 지원</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
              </div>
            </div>
          )}

          {state === 'preview' && (
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  미리보기 <span className="ml-1 font-normal text-slate-400">{rows.length}개 행</span>
                </p>
                <Button size="sm" variant="ghost" onClick={reset} className="text-xs text-slate-400">다시 선택</Button>
              </div>
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border-b px-2 py-1.5 text-left text-slate-500">#</th>
                      {COLUMNS.map((c) => (
                        <th key={c.key} className="border-b px-2 py-1.5 text-left text-slate-500 whitespace-nowrap">
                          {c.key}{c.required && <span className="text-rose-400">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="border-b px-2 py-1.5 text-slate-400">{i + 1}</td>
                        {COLUMNS.map((c) => (
                          <td key={c.key} className="border-b px-2 py-1.5 text-slate-700 max-w-[120px] truncate">
                            {(row as any)[c.key] || <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <p className="text-center text-xs text-slate-400">처음 10개만 미리보기 · 전체 {rows.length}개 업로드 예정</p>
              )}
            </div>
          )}

          {state === 'done' && result && (
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">{result.success}개 제품 등록 완료</p>
                  <p className="text-xs text-emerald-600">제품 목록에서 각 제품을 수정하여 품목 마스터를 연결하세요.</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-600" />
                    <p className="text-xs font-semibold text-amber-700">오류 목록</p>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-amber-700">{e.row}행: {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t px-5 py-3">
          {state === 'preview' && (
            <Button onClick={handleUpload} className="w-full bg-teal-600 hover:bg-teal-700">
              {rows.length}개 제품 등록
            </Button>
          )}
          {state === 'uploading' && (
            <Button disabled className="w-full">
              <Loader2 size={14} className="mr-1.5 animate-spin" />업로드 중...
            </Button>
          )}
          {state === 'done' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">추가 업로드</Button>
              <Button onClick={() => setOpen(false)} className="flex-1 bg-teal-600 hover:bg-teal-700">닫기</Button>
            </div>
          )}
          {state === 'idle' && (
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">닫기</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
