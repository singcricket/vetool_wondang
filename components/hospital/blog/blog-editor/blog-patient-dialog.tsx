'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserRound, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { searchPatients } from '@/lib/services/patient/patient'
import { updateBlogPatient } from '@/lib/actions/blog/blog-actions'
import SpeciesToIcon from '@/components/common/species-to-icon'
import { calculateAge } from '@/lib/utils/utils'
import type { Patient } from '@/types'
import type { Species } from '@/constants/hospital/register/signalments'
import type { BlogPatient } from '@/types/hospital/blog-type'

interface Props {
  hosId: string
  postId: string | null
  patient: BlogPatient | null
  onPatientChange: (patient: BlogPatient | null) => void
}

export default function BlogPatientDialog({ hosId, postId, patient, onPatientChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [searching, setSearching] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const debouncedSearch = useDebouncedCallback(async (term: string) => {
    if (!term.trim()) { setResults([]); return }
    setSearching(true)
    const data = await searchPatients(term.split(',').map((s) => s.trim()), hosId)
    setResults(data ?? [])
    setSearching(false)
  }, 400)

  const handleConnect = async (p: Patient) => {
    if (!postId) return
    setConnecting(true)
    try {
      await updateBlogPatient(hosId, postId, p.patient_id)
      onPatientChange({
        patient_id: p.patient_id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        gender: p.gender,
        birth: p.birth,
        hos_patient_id: p.hos_patient_id,
        is_alive: p.is_alive,
        owner_name: p.owner_name ?? null,
      })
      toast.success(`${p.name} 연결 완료`)
      setOpen(false)
      setQuery('')
      setResults([])
    } catch {
      toast.error('환자 연결 실패')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!postId) return
    try {
      await updateBlogPatient(hosId, postId, null)
      onPatientChange(null)
      toast.success('환자 연결 해제')
    } catch {
      toast.error('연결 해제 실패')
    }
  }

  // 저장 전(postId 없음) — 비활성 상태
  if (!postId) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
        <UserRound size={14} />
        임시저장 후 환자를 연결할 수 있습니다
      </div>
    )
  }

  // 환자 연결된 상태
  if (patient) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <SpeciesToIcon species={patient.species as Species} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {!patient.is_alive && <span className="text-xs">🌈</span>}
            <span className="text-sm font-semibold text-slate-800">{patient.name}</span>
            <span className="text-xs text-slate-400">{patient.hos_patient_id}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {patient.breed} · {patient.gender.toUpperCase()} · {calculateAge(patient.birth)}
            {patient.owner_name && ` · ${patient.owner_name}`}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          className="shrink-0 rounded p-1 text-slate-300 hover:text-rose-500"
          title="연결 해제"
        >
          <X size={13} />
        </button>
      </div>
    )
  }

  // 연결 없음 — 버튼
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start gap-2 text-xs text-slate-500"
      >
        <UserRound size={14} />
        환자 연결
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setQuery(''); setResults([]) } }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>환자 검색 및 연결</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); debouncedSearch(e.target.value) }}
            placeholder="환자 번호, 환자명, 보호자명으로 검색"
            autoFocus
          />

          <div className="max-h-[380px] overflow-y-auto">
            {searching ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : results.length === 0 && query.trim() ? (
              <p className="py-8 text-center text-sm text-slate-400">검색 결과가 없습니다.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {results.map((p) => (
                    <tr key={p.patient_id} className="hover:bg-slate-50">
                      <td className="px-2 py-2.5">
                        <SpeciesToIcon species={p.species as Species} />
                      </td>
                      <td className="px-2 py-2.5 font-medium text-slate-800">
                        {p.name}
                        {!p.is_alive && ' 🌈'}
                      </td>
                      <td className="px-2 py-2.5 text-slate-500">{p.hos_patient_id}</td>
                      <td className="px-2 py-2.5 text-slate-500">{p.breed}</td>
                      <td className="px-2 py-2.5 text-slate-500 uppercase">{p.gender}</td>
                      <td className="px-2 py-2.5 text-slate-500">{calculateAge(p.birth)}</td>
                      <td className="px-2 py-2.5 text-slate-500">{p.owner_name}</td>
                      <td className="px-2 py-2.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnect(p)}
                          disabled={connecting}
                          className="text-xs"
                        >
                          {connecting ? <Loader2 size={12} className="animate-spin" /> : '연결'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
