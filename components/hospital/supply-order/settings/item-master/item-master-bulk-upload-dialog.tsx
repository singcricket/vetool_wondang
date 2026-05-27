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
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { bulkCreateItemMasters } from '@/lib/actions/supply-order/item-master-actions'
import type { ItemMasterCsvRow } from '@/types/hospital/supply-order-type'

// ── 컬럼 정의 ─────────────────────────────────────────────────

const COLUMNS = [
  {
    key: 'category',
    label: '카테고리',
    required: true,
    description: '주사제 / 수액제 / 경구제 / 안약·연고 / 의료소모품 / 검사소모품 / 진단키트 / 장비소모품 / 기타',
    example: '수액제',
  },
  {
    key: 'generic_name',
    label: '품목명',
    required: true,
    description: '병원에서 부르는 기준 품목명 (브랜드명 아님)',
    example: 'N/S 500mL',
  },
  {
    key: 'ingredient',
    label: '성분명',
    required: false,
    description: '주성분명. 약물에 특히 유용',
    example: 'NaCl 0.9%',
  },
  {
    key: 'base_unit',
    label: '기준단위',
    required: true,
    description: '재고 집계 기준 최소 단위',
    example: '팩',
  },
  {
    key: 'aliases',
    label: '별칭',
    required: false,
    description: '세미콜론(;)으로 구분하여 여러 개 입력 가능. AI 매핑·검색에 활용',
    example: 'NS500;생리식염수500;0.9% NaCl 500',
  },
  {
    key: 'description',
    label: '설명',
    required: false,
    description: '용도, 주의사항 등 추가 설명',
    example: '수술·처치 시 수액 기본',
  },
  {
    key: 'alert_min_stock',
    label: '최소재고경고',
    required: false,
    description: '이 수량 이하 시 경고 (숫자만, 미입력 시 0)',
    example: '10',
  },
  {
    key: 'reorder_qty',
    label: '발주권장수량',
    required: false,
    description: '발주 시 권장 수량 (숫자만, 미입력 시 0)',
    example: '50',
  },
] as const

// ── 샘플 데이터 생성 ──────────────────────────────────────────

function downloadSampleFile() {
  const headers = COLUMNS.map((c) => c.key)
  const sample = [
    ['수액제', 'N/S 500mL', 'NaCl 0.9%', '팩', 'NS500;생리식염수500', '수술·처치 시 수액 기본', '10', '50'],
    ['수액제', 'D5W 500mL', 'Dextrose 5%', '팩', 'D5W;5% 포도당', '', '5', '20'],
    ['경구제', '아목시실린 250mg 캡슐', 'Amoxicillin', '정', 'AMX250;아목시', '', '20', '100'],
    ['주사제', '세파졸린 1g 바이알', 'Cefazolin', '바이알', '', '', '10', '50'],
    ['의료소모품', '주사기 5mL', '', '개', '5cc시린지', '', '50', '200'],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample])

  // 컬럼 너비 설정
  ws['!cols'] = headers.map(() => ({ wch: 20 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '품목마스터')
  XLSX.writeFile(wb, 'item_master_sample.xlsx')
}

// ── 파싱 ─────────────────────────────────────────────────────

function parseFile(file: File): Promise<ItemMasterCsvRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
          defval: '',
          raw: false,
        })
        resolve(rows as ItemMasterCsvRow[])
      } catch {
        reject(new Error('파일을 읽을 수 없습니다.'))
      }
    }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsArrayBuffer(file)
  })
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

interface Props {
  hosId: string
}

type UploadState = 'idle' | 'preview' | 'uploading' | 'done'

export default function ItemMasterBulkUploadDialog({ hosId }: Props) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<UploadState>('idle')
  const [rows, setRows] = useState<ItemMasterCsvRow[]>([])
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
      const res = await bulkCreateItemMasters(hosId, rows)
      setResult(res)
      setState('done')
      if (res.success > 0) toast.success(`${res.success}개 품목이 등록되었습니다.`)
      if (res.errors.length > 0) toast.warning(`${res.errors.length}개 행에 오류가 있습니다.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드 실패')
      setState('preview')
    }
  }

  const reset = () => {
    setState('idle')
    setRows([])
    setResult(null)
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) reset()
  }

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
          <DialogTitle className="text-base">품목 마스터 대량 업로드</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">

          {/* idle: 컬럼 안내 + 파일 선택 */}
          {state === 'idle' && (
            <div className="flex flex-col gap-5 p-5">

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
                  순서는 관계없으며, 선택 컬럼은 생략 가능합니다.
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
                          <td className="border-b px-3 py-2 font-mono font-semibold text-teal-700">
                            {col.key}
                          </td>
                          <td className="border-b px-3 py-2 text-slate-700">{col.label}</td>
                          <td className="border-b px-3 py-2">
                            {col.required ? (
                              <span className="font-semibold text-rose-500">필수</span>
                            ) : (
                              <span className="text-slate-400">선택</span>
                            )}
                          </td>
                          <td className="border-b px-3 py-2 text-slate-500">
                            <div>{col.description}</div>
                            <div className="mt-0.5 font-mono text-slate-400">예) {col.example}</div>
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
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
            </div>
          )}

          {/* preview: 파싱된 데이터 미리보기 */}
          {state === 'preview' && (
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  미리보기 <span className="ml-1 font-normal text-slate-400">{rows.length}개 행</span>
                </p>
                <Button size="sm" variant="ghost" onClick={reset} className="text-xs text-slate-400">
                  다시 선택
                </Button>
              </div>
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border-b px-2 py-1.5 text-left text-slate-500">#</th>
                      {COLUMNS.map((c) => (
                        <th key={c.key} className="border-b px-2 py-1.5 text-left text-slate-500 whitespace-nowrap">
                          {c.key}
                          {c.required && <span className="text-rose-400">*</span>}
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
                <p className="text-center text-xs text-slate-400">
                  처음 10개만 미리보기 표시 · 전체 {rows.length}개 업로드 예정
                </p>
              )}
            </div>
          )}

          {/* done: 결과 */}
          {state === 'done' && result && (
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    {result.success}개 품목 등록 완료
                  </p>
                  {result.errors.length > 0 && (
                    <p className="text-xs text-emerald-600">{result.errors.length}개 행 오류 (아래 확인)</p>
                  )}
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
                      <li key={i} className="text-xs text-amber-700">
                        {e.row}행: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="shrink-0 border-t px-5 py-3">
          {state === 'preview' && (
            <Button
              onClick={handleUpload}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {rows.length}개 품목 등록
            </Button>
          )}
          {state === 'uploading' && (
            <Button disabled className="w-full">
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              업로드 중...
            </Button>
          )}
          {state === 'done' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                추가 업로드
              </Button>
              <Button onClick={() => setOpen(false)} className="flex-1 bg-teal-600 hover:bg-teal-700">
                닫기
              </Button>
            </div>
          )}
          {state === 'idle' && (
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
              닫기
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
