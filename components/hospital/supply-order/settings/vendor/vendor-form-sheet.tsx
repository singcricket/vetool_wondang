'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createVendor, updateVendor } from '@/lib/actions/supply-order/vendor-actions'
import type { Vendor, VendorContact, VendorFormInput } from '@/types/hospital/supply-order-type'

const VENDOR_CATEGORIES = ['의약품', '의료소모품', '검사소모품', '장비소모품', '사료', '용품','기타']

const EMPTY_FORM: VendorFormInput = {
  name: '',
  categories: [],
  representative: '',
  representative_phone: '',
  contacts: [],
  address: '',
  memo: '',
  is_active: true,
}

function toForm(v: Vendor): VendorFormInput {
  return {
    name: v.name,
    categories: v.categories,
    representative: v.representative ?? '',
    representative_phone: v.representative_phone ?? '',
    contacts: v.contacts,
    address: v.address ?? '',
    memo: v.memo ?? '',
    is_active: v.is_active,
  }
}

interface Props {
  hosId: string
  vendor?: Vendor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function VendorFormSheet({ hosId, vendor, open, onOpenChange }: Props) {
  const isEdit = !!vendor
  const [form, setForm] = useState<VendorFormInput>(vendor ? toForm(vendor) : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [newContact, setNewContact] = useState<VendorContact>({ name: '', phone: '', memo: '' })

  useEffect(() => {
    if (open) {
      setForm(vendor ? toForm(vendor) : EMPTY_FORM)
      setNewContact({ name: '', phone: '', memo: '' })
    }
  }, [open, vendor])

  const set = <K extends keyof VendorFormInput>(key: K, value: VendorFormInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleCategory = (cat: string) => {
    set(
      'categories',
      form.categories.includes(cat)
        ? form.categories.filter((c) => c !== cat)
        : [...form.categories, cat],
    )
  }

  const addContact = () => {
    if (!newContact.name.trim() && !newContact.phone.trim()) return
    set('contacts', [...form.contacts, { ...newContact }])
    setNewContact({ name: '', phone: '', memo: '' })
  }

  const removeContact = (idx: number) => {
    set('contacts', form.contacts.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('업체명을 입력하세요.')
      return
    }
    try {
      setSaving(true)
      if (isEdit && vendor) {
        await updateVendor(hosId, vendor.id, form)
      } else {
        await createVendor(hosId, form)
      }
      toast.success(isEdit ? '업체 정보가 수정되었습니다.' : '업체가 등록되었습니다.')
      onOpenChange(false)
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="shrink-0 border-b pb-3">
          <SheetTitle className="text-base">{isEdit ? '업체 수정' : '업체 등록'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">

          {/* 업체명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">업체명 *</Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="예) JW중외제약"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1.5">
            <Label className="text-xs">취급 카테고리</Label>
            <div className="flex flex-wrap gap-1.5">
              {VENDOR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    form.categories.includes(cat)
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 대표자 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">대표자명</Label>
              <Input
                value={form.representative}
                onChange={(e) => set('representative', e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">대표 연락처</Label>
              <Input
                value={form.representative_phone}
                onChange={(e) => set('representative_phone', e.target.value)}
                placeholder="02-0000-0000"
              />
            </div>
          </div>

          {/* 담당자 목록 */}
          <div className="space-y-2">
            <Label className="text-xs">담당자</Label>
            {form.contacts.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded border bg-slate-50 px-2 py-1.5">
                <span className="flex-1 text-xs">
                  {c.name} {c.phone && <span className="text-slate-400">{c.phone}</span>}
                  {c.memo && <span className="ml-1 text-slate-400">({c.memo})</span>}
                </span>
                <button type="button" onClick={() => removeContact(idx)}>
                  <X size={13} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
              <Input
                value={newContact.name}
                onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                placeholder="이름"
                className="text-xs"
              />
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                placeholder="연락처"
                className="text-xs"
              />
              <Button type="button" size="icon" variant="outline" onClick={addContact} className="h-9 w-9">
                <Plus size={14} />
              </Button>
            </div>
            <Input
              value={newContact.memo}
              onChange={(e) => setNewContact((p) => ({ ...p, memo: e.target.value }))}
              placeholder="메모 (선택)"
              className="text-xs"
            />
          </div>

          {/* 주소 */}
          <div className="space-y-1.5">
            <Label className="text-xs">주소</Label>
            <Input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="서울시 ..."
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              className="resize-none text-xs"
              rows={2}
            />
          </div>

          {/* 활성 여부 */}
          {isEdit && (
            <div className="flex items-center justify-between rounded border px-3 py-2">
              <span className="text-xs text-slate-600">활성 업체</span>
              <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t pt-3">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
            {saving ? '저장 중...' : isEdit ? '수정 저장' : '등록'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
