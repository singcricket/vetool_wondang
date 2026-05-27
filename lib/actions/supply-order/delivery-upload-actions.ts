'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import type {
  ExtractedDeliveryItem,
  ReviewDeliveryItem,
  ItemProduct,
} from '@/types/hospital/supply-order-type'

// ── 열 이름 감지 ─────────────────────────────────────────────

const COLUMN_ALIASES: Record<keyof ExtractedDeliveryItem, string[]> = {
  raw_name:         ['제품명', '품명', '상품명', '약품명', '물품명', '품목명', '제품', '품목', '명칭'],
  raw_manufacturer: ['제조사', '제조업체', '제조', '메이커', '업체'],
  raw_spec:         ['규격', '스펙', 'spec', '사양', '용량'],
  quantity_received:['수량', '납품수량', '수령수량', '발주수량', '주문수량', 'qty', '수'],
  unit:             ['단위', '단위명'],
  unit_price:       ['단가', '납품단가', '공급단가', '가격', '단위가격', '공급가'],
  expiry_date:      ['유통기한', '만료일', '유효기한', '사용기한', 'exp', '기한'],
  lot_number:       ['lot', 'lot번호', '로트', '로트번호', '배치번호', 'batch', '제조번호'],
}

function detectColumn(header: string): keyof ExtractedDeliveryItem | null {
  const h = header.toLowerCase().trim()
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((a) => h.includes(a.toLowerCase()))) {
      return field as keyof ExtractedDeliveryItem
    }
  }
  return null
}

// ── 1단계: Excel 파싱 ─────────────────────────────────────────

export async function parseDeliveryExcel(
  formData: FormData,
): Promise<ExtractedDeliveryItem[]> {
  const file = formData.get('file') as File
  if (!file) throw new Error('파일이 없습니다.')

  const buffer = Buffer.from(await file.arrayBuffer())
  // dynamic import — xlsx는 서버에서만 사용
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: (string | number | Date | null)[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  }) as any

  if (rows.length < 2) return []

  // 헤더 행 탐지 (첫 번째 행 또는 '제품명' 키워드가 있는 첫 행)
  let headerRowIdx = 0
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (rows[i].some((cell) => typeof cell === 'string' && detectColumn(cell) === 'raw_name')) {
      headerRowIdx = i
      break
    }
  }

  const headers = rows[headerRowIdx] as string[]
  const fieldMap: Record<number, keyof ExtractedDeliveryItem> = {}
  headers.forEach((h, colIdx) => {
    if (!h) return
    const field = detectColumn(String(h))
    if (field) fieldMap[colIdx] = field
  })

  const items: ExtractedDeliveryItem[] = []
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r]
    const obj: Partial<ExtractedDeliveryItem> = {}
    for (const [colIdx, field] of Object.entries(fieldMap)) {
      const val = row[Number(colIdx)]
      if (val == null || val === '') continue
      if (field === 'quantity_received' || field === 'unit_price') {
        obj[field] = Number(val) || 0
      } else if (field === 'expiry_date') {
        if (val instanceof Date) {
          obj[field] = val.toISOString().split('T')[0]
        } else {
          const s = String(val).trim()
          // YYYYMMDD → YYYY-MM-DD
          if (/^\d{8}$/.test(s)) {
            obj[field] = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
          } else {
            obj[field] = s || null
          }
        }
      } else {
        ;(obj as any)[field] = String(val).trim() || null
      }
    }
    if (!obj.raw_name) continue
    items.push({
      raw_name: obj.raw_name!,
      raw_spec: obj.raw_spec ?? null,
      raw_manufacturer: obj.raw_manufacturer ?? null,
      quantity_received: obj.quantity_received ?? 1,
      unit: obj.unit ?? '개',
      unit_price: obj.unit_price ?? null,
      expiry_date: obj.expiry_date ?? null,
      lot_number: obj.lot_number ?? null,
    })
  }

  return items
}

// ── 2단계: AI 매칭 ────────────────────────────────────────────

export async function matchItemsWithAI(
  items: ExtractedDeliveryItem[],
  itemProducts: ItemProduct[],
): Promise<ReviewDeliveryItem[]> {
  if (!items.length) return []

  // 매칭 대상이 없으면 모두 신규
  if (!itemProducts.length) {
    return items.map((item, i) => ({
      ...item,
      _id: String(i),
      match_status: 'unmatched' as const,
      match_confidence: null,
      matched_product_id: null,
      decision: 'new_product' as const,
    }))
  }

  try {
    const client = getAnthropicClient()

    const productList = itemProducts.slice(0, 300).map((p) => ({
      id: p.id,
      brand_name: p.brand_name,
      manufacturer: p.manufacturer ?? null,
      specification: p.specification ?? null,
      generic_name: p.item_master?.generic_name ?? null,
    }))

    const extractedList = items.map((item, i) => ({
      index: i,
      raw_name: item.raw_name,
      raw_spec: item.raw_spec,
      raw_manufacturer: item.raw_manufacturer,
    }))

    const prompt = `납품전표에서 추출된 품목들을 기존 제품 목록과 매칭해주세요.

추출된 품목 (${extractedList.length}개):
${JSON.stringify(extractedList)}

기존 제품 목록 (${productList.length}개):
${JSON.stringify(productList)}

각 추출 품목에 대해 가장 유사한 기존 제품을 찾아 JSON 배열로만 반환하세요.
제품명, 성분, 제조사, 규격을 종합적으로 고려하세요.

반환 형식:
[{"index":0,"matched_product_id":"ID 또는 null","confidence":0.95}]

confidence 기준: 0.85 이상=확실, 0.6~0.85=추정, 0.6 미만=null 반환
JSON만 반환하세요.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const clean = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')
    const matches: { index: number; matched_product_id: string | null; confidence: number }[] =
      JSON.parse(clean.slice(start, end + 1))

    return items.map((item, i) => {
      const m = matches.find((x) => x.index === i)
      const productId = m?.matched_product_id ?? null
      const confidence = m?.confidence ?? 0

      const matchStatus: ReviewDeliveryItem['match_status'] = productId
        ? confidence >= 0.85 ? 'matched' : 'ai_suggested'
        : 'unmatched'

      return {
        ...item,
        _id: String(i),
        match_status: matchStatus,
        match_confidence: productId ? confidence : null,
        matched_product_id: productId,
        decision: (productId ? 'confirm' : 'new_product') as ReviewDeliveryItem['decision'],
      }
    })
  } catch {
    // AI 실패 시 모두 unmatched 반환
    return items.map((item, i) => ({
      ...item,
      _id: String(i),
      match_status: 'unmatched' as const,
      match_confidence: null,
      matched_product_id: null,
      decision: 'new_product' as const,
    }))
  }
}

// ── 3단계: 사진 OCR ───────────────────────────────────────────

export async function extractFromInvoicePhoto(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
): Promise<ExtractedDeliveryItem[]> {
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64Image },
          },
          {
            type: 'text',
            text: `이 이미지는 의약품/의료소모품 납품전표 또는 거래명세서입니다.
이미지에서 납품 품목 목록을 추출하여 JSON 배열로만 반환하세요.

반환 형식:
[
  {
    "raw_name": "제품명",
    "raw_spec": "규격 또는 null",
    "raw_manufacturer": "제조사 또는 null",
    "quantity_received": 수량(숫자),
    "unit": "단위(개/박스/병 등)",
    "unit_price": 단가(숫자 또는 null),
    "expiry_date": "YYYY-MM-DD 또는 null",
    "lot_number": "LOT번호 또는 null"
  }
]

주의: 수량 불명확 시 1, 단가는 개당 단가(합계 아님), 반드시 JSON만 반환`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const clean = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  const start = clean.indexOf('[')
  const end = clean.lastIndexOf(']')
  if (start === -1 || end === -1) return []
  return JSON.parse(clean.slice(start, end + 1)) as ExtractedDeliveryItem[]
}

// ── 최종 저장 ─────────────────────────────────────────────────

export async function bulkSaveReviewedItems(
  hosId: string,
  deliveryId: string,
  items: ReviewDeliveryItem[],
): Promise<void> {
  const supabase = await createClient()

  const toSave = items.filter((item) => item.decision !== 'skip')
  if (!toSave.length) return

  for (const item of toSave) {
    let productId = item.matched_product_id

    // 신규 제품 등록
    if (!productId || item.decision === 'new_product') {
      const { data: newProduct, error } = await supabase
        .from('item_products')
        .insert({
          hos_id: hosId,
          brand_name: item.raw_name.trim(),
          manufacturer: item.raw_manufacturer?.trim() || null,
          specification: item.raw_spec?.trim() || null,
          package_type: '낱개',
          units_per_package: 1,
          is_active: true,
          item_master_id: null,
        })
        .select('id')
        .single()
      if (error || !newProduct) throw new Error(error?.message ?? '제품 생성 실패')
      productId = newProduct.id
    }

    // 연결된 item_master 조회
    const { data: product } = await supabase
      .from('item_products')
      .select('item_master_id')
      .eq('id', productId)
      .single()

    const mappingStatus =
      item.match_status === 'unmatched' ? 'pending' :
      item.match_status === 'ai_suggested' ? 'ai_suggested' : 'mapped'

    await supabase.from('delivery_items').insert({
      delivery_id: deliveryId,
      raw_name: item.raw_name,
      raw_spec: item.raw_spec,
      raw_manufacturer: item.raw_manufacturer,
      raw_quantity: String(item.quantity_received),
      item_product_id: productId,
      item_master_id: product?.item_master_id ?? null,
      quantity_received: item.quantity_received,
      unit: item.unit,
      units_per_package: 1,
      unit_price: item.unit_price,
      expiry_date: item.expiry_date,
      lot_number: item.lot_number,
      mapping_status: mappingStatus,
      mapping_confidence: item.match_confidence,
    })
  }

  revalidatePath(`/hospital/${hosId}/supply-order/order`)
}
