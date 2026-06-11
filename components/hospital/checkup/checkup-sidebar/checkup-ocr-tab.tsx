'use client'

import { useRef, useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Camera, ChevronDown, ClipboardPaste, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/utils'
import { extractPatientFromImage } from '@/lib/actions/patient/patient-ocr-actions'
import { registerPatientAndCheckupRecord } from '@/lib/actions/checkup/checkup-actions'
import { CANINE_BREEDS, FELINE_BREEDS, SEX } from '@/constants/hospital/register/signalments'
import type { ExtractedPatientData } from '@/lib/actions/patient/patient-ocr-actions'

// ── 타입 ─────────────────────────────────────────────────────

type Step = 'idle' | 'analyzing' | 'review'

type FormState = {
  name: string
  hos_patient_id: string
  species: 'canine' | 'feline' | ''
  breed: string
  gender: string
  birth: string
  microchip_no: string
  weight: string
  owner_name: string
  hos_owner_id: string
  memo: string
}

const EMPTY_FORM: FormState = {
  name: '', hos_patient_id: '', species: '', breed: '',
  gender: '', birth: '', microchip_no: '', weight: '',
  owner_name: '', hos_owner_id: '', memo: '',
}

// ── 헬퍼 ─────────────────────────────────────────────────────

function findBreed(breedRaw: string | null, breeds: typeof CANINE_BREEDS | typeof FELINE_BREEDS): string {
  if (!breedRaw) return ''
  const q = breedRaw.toLowerCase().replace(/\s/g, '')
  const found = (breeds as readonly { id: number; eng: string; kor: string }[]).find((b) => {
    const kor = b.kor.toLowerCase().replace(/\s/g, '')
    const eng = b.eng.toLowerCase().replace(/[\s_]/g, '')
    return kor.includes(q) || q.includes(kor) || eng.includes(q) || q.includes(eng)
  })
  return found ? `${found.eng}#${found.kor}` : ''
}

function dataToForm(data: ExtractedPatientData): FormState {
  const species = data.species ?? ''
  const breeds = species === 'feline' ? FELINE_BREEDS : CANINE_BREEDS
  return {
    name: data.name ?? '',
    hos_patient_id: data.hos_patient_id ?? '',
    species,
    breed: findBreed(data.breed_raw, breeds),
    gender: data.gender ?? '',
    birth: data.birth ?? '',
    microchip_no: data.microchip_no ?? '',
    weight: data.weight ?? '',
    owner_name: data.owner_name ?? '',
    hos_owner_id: data.hos_owner_id ?? '',
    memo: data.memo ?? '',
  }
}

// ── 컴포넌트 ─────────────────────────────────────────────────

interface Props {
  hosId: string
  targetDate: string
  setOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export default function CheckupOcrTab({ hosId, targetDate, setOpen, onRegistered }: Props) {
  const { push } = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [breedRaw, setBreedRaw] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [breedOpen, setBreedOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const BREEDS = form.species === 'feline' ? FELINE_BREEDS : CANINE_BREEDS
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // 클립보드 붙여넣기
  useEffect(() => {
    if (step !== 'idle') return
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) handleFile(file)
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1600
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1])
      }
      img.onerror = reject
      img.src = url
    })

  const handleFile = async (file: File) => {
    setStep('analyzing')
    try {
      const base64 = await compressImage(file)
      const data = await extractPatientFromImage(base64, hosId)
      setBreedRaw(data.breed_raw)
      setForm(dataToForm(data))
      setStep('review')
    } catch (e: any) {
      toast.error(e?.message ?? 'OCR 처리에 실패했습니다.')
      setStep('idle')
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('환자 이름을 입력하세요.')
    if (!form.species) return toast.error('종을 선택하세요.')
    if (!form.breed) return toast.error('품종을 선택하세요.')
    if (!form.gender) return toast.error('성별을 선택하세요.')
    if (!form.birth) return toast.error('생년월일을 입력하세요.')

    try {
      setSubmitting(true)
      const checkupId = await registerPatientAndCheckupRecord({
        hosId,
        targetDate,
        patient: {
          name: form.name.trim(),
          hos_patient_id: form.hos_patient_id.trim(),
          species: form.species,
          breed: form.breed.split('#')[0],
          gender: form.gender,
          birth: form.birth,
          microchip_no: form.microchip_no.trim() || undefined,
          weight: form.weight.trim() || undefined,
          owner_name: form.owner_name.trim() || undefined,
          hos_owner_id: form.hos_owner_id.trim() || undefined,
          memo: form.memo.trim() || undefined,
        },
      })
      toast.success('환자 등록 및 검진이 생성되었습니다.')
      onRegistered()
      setOpen(false)
      push(`/hospital/${hosId}/checkup/${targetDate}/${checkupId}`)
    } catch {
      toast.error('등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-0" style={{ minHeight: 480 }}>
      <div className="flex-1 overflow-y-auto">

        {/* ── Step 1: idle ── */}
        {step === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-4">
            <div
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-14 transition-colors',
                isDragging
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/30',
              )}
            >
              <Camera size={36} className={isDragging ? 'text-teal-400' : 'text-slate-300'} />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600">
                  {isDragging ? '여기에 놓으세요' : '클릭하여 파일 선택'}
                </p>
                <p className="mt-2 text-xs text-slate-400">또는</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Upload size={11} />드래그 앤 드랍</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1"><ClipboardPaste size={11} />Ctrl+V 붙여넣기</span>
              </div>
              <p className="text-[11px] text-slate-400">JPG · PNG · WEBP</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
            <p className="text-center text-[11px] text-slate-400">
              Google Vision OCR + AI로 환자 정보를 자동 추출합니다
            </p>
          </div>
        )}

        {/* ── Step 2: analyzing ── */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 size={32} className="animate-spin text-teal-500" />
            <p className="text-sm font-medium text-slate-600">이미지 분석 중...</p>
            <p className="text-xs text-slate-400">Google Vision OCR → AI 파싱</p>
          </div>
        )}

        {/* ── Step 3: review ── */}
        {step === 'review' && (
          <div className="flex flex-col gap-4 p-4 pb-2">
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-700">
              AI가 추출한 정보를 확인·수정 후 등록하세요.
              {breedRaw && <span className="ml-1 text-teal-500">인식된 품종: <strong>{breedRaw}</strong></span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">환자 이름 *</Label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">차트 번호</Label>
                <Input value={form.hos_patient_id} onChange={(e) => set('hos_patient_id', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">종 *</Label>
                <Select value={form.species} onValueChange={(v) => { set('species', v as 'canine' | 'feline'); set('breed', '') }}>
                  <SelectTrigger className={cn('h-8 text-sm', !form.species && 'text-muted-foreground')}>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canine">Canine</SelectItem>
                    <SelectItem value="feline">Feline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">품종 *</Label>
                <Popover open={breedOpen} onOpenChange={setBreedOpen} modal>
                  <PopoverTrigger asChild disabled={!form.species}>
                    <Button variant="outline" className={cn('relative h-8 w-full justify-start pl-3 text-sm font-normal', !form.breed && 'text-muted-foreground')}>
                      {form.breed ? form.breed.split('#')[0] : '품종 선택'}
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom">
                    <Command>
                      <CommandInput placeholder="품종 검색" className="h-8 text-xs" />
                      <CommandList>
                        <ScrollArea className="h-56">
                          <CommandEmpty>검색 결과 없음</CommandEmpty>
                          <CommandGroup>
                            {BREEDS.map((b) => (
                              <CommandItem key={b.id + b.eng} value={b.eng + '#' + b.kor} onSelect={(v) => { set('breed', v); setBreedOpen(false) }} className="text-xs">
                                {b.kor} ({b.eng})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </ScrollArea>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">성별 *</Label>
                <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                  <SelectTrigger className={cn('h-8 text-sm', !form.gender && 'text-muted-foreground')}>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEX.map((s) => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">생년월일 *</Label>
                <Input type="date" value={form.birth} onChange={(e) => set('birth', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">체중 (kg)</Label>
                <Input value={form.weight} onChange={(e) => set('weight', e.target.value)} className="h-8 text-sm" placeholder="0.0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">마이크로칩 번호</Label>
                <Input value={form.microchip_no} onChange={(e) => set('microchip_no', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">보호자 이름</Label>
                <Input value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">보호자 번호</Label>
                <Input value={form.hos_owner_id} onChange={(e) => set('hos_owner_id', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">메모</Label>
                <Textarea value={form.memo} onChange={(e) => set('memo', e.target.value)} className="resize-none text-sm" rows={2} />
              </div>
            </div>

            <button type="button" onClick={() => { setStep('idle'); setForm(EMPTY_FORM); setBreedRaw(null) }} className="text-xs text-slate-400 hover:text-slate-600">
              ↩ 다른 사진으로 다시 시도
            </button>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      {step === 'review' && (
        <div className="shrink-0 border-t p-4">
          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700">
            {submitting && <Loader2 size={14} className="mr-1 animate-spin" />}
            환자 등록 및 검진 생성
          </Button>
        </div>
      )}
    </div>
  )
}
