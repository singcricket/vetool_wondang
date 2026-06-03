'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'
import type { LedgerDetail } from '@/lib/actions/supply-order/ledger-actions'

interface Props {
  detail: LedgerDetail
  fromDate: string
  toDate: string
  onClose: () => void
}

export default function LedgerPrintDialog({ detail, fromDate, toDate, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const { product, opening_stock, entries } = detail

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>인체용 의약품 출납대장 - ${product.brand_name}</title>
          <style>
            @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; }
            body { font-size: 11pt; color: #000; }
            .header-box { border: 1px solid #000; padding: 8px 12px; margin-bottom: 4px; }
            .header-box p { font-size: 10pt; margin-bottom: 2px; }
            h1 { text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 10px; letter-spacing: 2px; }
            .sub-title { text-align: right; font-size: 8pt; color: #555; margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
            th, td { border: 1px solid #000; padding: 4px 6px; text-align: center; vertical-align: middle; }
            th { background: #f0f0f0; font-weight: bold; }
            td.left { text-align: left; }
            .in { color: #0056b3; }
            .out { color: #c0392b; }
            tr:nth-child(even) td { background: #fafafa; }
            .opening-row td { background: #fffde7; font-style: italic; }
            .footer { margin-top: 8px; text-align: right; font-size: 8pt; color: #555; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  return (
    <>
      {/* 팝업 헤더 */}
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">인체용 의약품 출납대장</p>
          <p className="text-xs text-slate-400">{fromDate} ~ {toDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            size="sm"
            className="h-8 gap-1 bg-teal-600 px-3 text-xs hover:bg-teal-700"
          >
            <Printer size={13} /> PDF 출력
          </Button>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* 인쇄 대상 영역 */}
        <div ref={printRef}>
          <h1>인체용 의약품 출납대장</h1>
          <div className="sub-title" style={{ textAlign: 'right', fontSize: '8pt', color: '#555', marginBottom: '6px' }}>
            동물용 의약품등 취급규칙 [별지 제16호의2서식]
          </div>

          <div className="header-box" style={{ border: '1px solid #000', padding: '8px 12px', marginBottom: '4px' }}>
            <p>□ 약품명(제조회사): <strong>{product.brand_name}</strong>{product.manufacturer ? `　(${product.manufacturer})` : ''}</p>
            <p>□ 약품성분: <strong>{product.generic_name ?? product.specification ?? '—'}</strong></p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={thStyle({ width: '120px' })}>연월일</th>
                <th colSpan={2} style={thStyle()}>구 매 량</th>
                <th rowSpan={2} style={thStyle({ width: '110px' })}>구매처<br />(약국명)</th>
                <th rowSpan={2} style={thStyle({ width: '72px' })}>사 용 량</th>
                <th rowSpan={2} style={thStyle({ width: '72px' })}>재 고 량</th>
                <th rowSpan={2} style={thStyle({ width: '120px' })}>비고</th>
              </tr>
              <tr>
                <th style={thStyle({ width: '52px' })}>단위</th>
                <th style={thStyle({ width: '60px' })}>수량</th>
              </tr>
            </thead>
            <tbody>
              {/* 기초재고 행 */}
              <tr style={{ background: '#fffde7', fontStyle: 'italic' }}>
                <td style={tdStyle()}>{fromDate} 이전</td>
                <td style={tdStyle()}>—</td>
                <td style={tdStyle()}>—</td>
                <td style={tdStyle()}>—</td>
                <td style={tdStyle()}>—</td>
                <td style={tdStyle()}><strong>{opening_stock}</strong> {product.base_unit}</td>
                <td style={{ ...tdStyle(), textAlign: 'left' }}>기초재고</td>
              </tr>

              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle(), textAlign: 'center', padding: '12px', color: '#888' }}>
                    해당 기간 거래 내역 없음
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={tdStyle()}>{entry.date}</td>
                    {entry.transaction_type === 'IN' ? (
                      <>
                        <td style={{ ...tdStyle(), color: '#0056b3' }}>{product.base_unit}</td>
                        <td style={{ ...tdStyle(), color: '#0056b3', fontWeight: 'bold' }}>{entry.quantity}</td>
                      </>
                    ) : (
                      <>
                        <td style={tdStyle()}>—</td>
                        <td style={tdStyle()}>—</td>
                      </>
                    )}
                    <td style={{ ...tdStyle(), textAlign: 'left', fontSize: '9pt' }}>
                      {entry.vendor_name ?? '—'}
                    </td>
                    <td style={{ ...tdStyle(), ...(entry.transaction_type === 'OUT' ? { color: '#c0392b', fontWeight: 'bold' } : {}) }}>
                      {entry.transaction_type === 'OUT' ? entry.quantity : '—'}
                    </td>
                    <td style={tdStyle()}><strong>{entry.running_balance}</strong> {product.base_unit}</td>
                    <td style={{ ...tdStyle(), textAlign: 'left', fontSize: '9pt' }}>
                      {[
                        entry.expiry_date ? `유통기한: ${entry.expiry_date}` : null,
                        entry.memo ?? null,
                      ].filter(Boolean).join(' / ')}
                    </td>
                  </tr>
                ))
              )}

              {/* 빈 행 추가 (인쇄 시 여백) */}
              {Array.from({ length: Math.max(0, 10 - entries.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={tdStyle()}>&nbsp;</td>
                  <td style={tdStyle()}></td>
                  <td style={tdStyle()}></td>
                  <td style={tdStyle()}></td>
                  <td style={tdStyle()}></td>
                  <td style={tdStyle()}></td>
                  <td style={tdStyle()}></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer" style={{ marginTop: '8px', textAlign: 'right', fontSize: '8pt', color: '#555' }}>
            210mm×297mm [백상지 80g/㎡]
          </div>
        </div>

        {/* 화면 미리보기용 요약 정보 */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          <p>총 {entries.length}건 · 입고 {entries.filter((e) => e.transaction_type === 'IN').reduce((s, e) => s + e.quantity, 0)} {product.base_unit} · 사용 {entries.filter((e) => e.transaction_type === 'OUT').reduce((s, e) => s + e.quantity, 0)} {product.base_unit}</p>
          <p className="mt-0.5">기말재고: <strong>{entries.length > 0 ? entries[entries.length - 1].running_balance : opening_stock}</strong> {product.base_unit}</p>
        </div>
      </div>
    </>
  )
}

const BORDER = '1px solid #000'
const BASE_CELL: React.CSSProperties = {
  border: BORDER,
  padding: '4px 6px',
  textAlign: 'center',
  verticalAlign: 'middle',
}

function thStyle(extra?: React.CSSProperties): React.CSSProperties {
  return { ...BASE_CELL, background: '#f0f0f0', fontWeight: 'bold', ...extra }
}

function tdStyle(extra?: React.CSSProperties): React.CSSProperties {
  return { ...BASE_CELL, ...extra }
}
