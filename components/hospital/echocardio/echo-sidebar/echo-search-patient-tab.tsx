'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { registerEchoChart } from '@/lib/services/echocardio/register-echo'

interface SearchedPatient {
  patient_id: string
  name: string
  species: string
  breed: string
  gender: string
  birth: string
  hos_patient_id: string
  hos_owner_id: string | null
  owner_name: string | null
}

interface Props {
  hosId: string
  targetDate: string
  setOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export default function EchoSearchPatientTab({
  hosId,
  targetDate,
  setOpen,
  onRegistered,
}: Props) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchedPatient[]>([])
  const [isPending, setIsPending] = useState(false)

  const debouncedSearch = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(
        `/api/echo/search-patient?hos_id=${hosId}&q=${encodeURIComponent(q)}`,
      )
      setResults(await res.json())
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, 400)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    debouncedSearch(e.target.value)
  }

  async function handleSelect(patient: SearchedPatient) {
    setIsPending(true)
    const echoId = await registerEchoChart({
      hosId,
      patientId: patient.patient_id,
      examDate: targetDate,
      patient: {
        hos_patient_id: patient.hos_patient_id,
        hos_owner_id: patient.hos_owner_id,
        name: patient.name,
        species: patient.species,
        breed: patient.breed,
        gender: patient.gender,
        birth: patient.birth,
      },
    })
    onRegistered()
    setOpen(false)
    router.push(`/hospital/${hosId}/echocardio/${targetDate}/${echoId}`)
  }

  return (
    <div className="flex h-[400px] flex-col gap-3">
      <div className="relative">
        <Input
          placeholder="환자 번호, 환자명, 품종으로 검색하세요"
          value={searchTerm}
          onChange={handleInputChange}
          autoFocus
        />
        {searchTerm && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            onClick={() => {
              setSearchTerm('')
              setResults([])
            }}
          >
            <XIcon />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded border">
        {isSearching && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            검색 중...
          </p>
        )}
        {!isSearching && results.length === 0 && searchTerm && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            검색 결과 없음
          </p>
        )}
        {!isSearching && results.length === 0 && !searchTerm && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            환자를 검색해주세요
          </p>
        )}
        {results.map((p) => (
          <div
            key={p.patient_id}
            className="flex items-center justify-between border-b px-3 py-2 last:border-0 hover:bg-muted/50"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">
                {p.hos_patient_id} · {p.species} · {p.breed} · {p.gender}
              </span>
              {p.owner_name && (
                <span className="text-xs text-muted-foreground">
                  보호자: {p.owner_name}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleSelect(p)}
            >
              선택
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
