'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { registerEchoChart, registerPatientAndEchoChart } from '@/lib/services/echocardio/register-echo'
import { useEchoContext } from '@/providers/echo-context-provider'

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

interface EchoRegisterDialogProps {
  hosId: string
  targetDate: string
  onClose: () => void
  onRegistered: () => void
}

type Tab = 'search' | 'new'

export default function EchoRegisterDialog({
  hosId,
  targetDate,
  onClose,
  onRegistered,
}: EchoRegisterDialogProps) {
  const router = useRouter()
  const { echoContextData } = useEchoContext()
  const { vetsList } = echoContextData

  const [tab, setTab] = useState<Tab>('search')
  const [isPending, startTransition] = useTransition()

  // 환자 검색
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchedPatient[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 신규 환자 폼
  const [newPatient, setNewPatient] = useState({
    name: '',
    species: 'canine',
    breed: '',
    gender: 'M',
    birth: '',
    hos_patient_id: '',
    owner_name: '',
  })

  // 공통 필드
  const [vetId, setVetId] = useState('')
  const [examinerId, setExaminerId] = useState('')
  const [userTags, setUserTags] = useState('')
  const [examDate, setExamDate] = useState(targetDate)

  // 환자 검색 핸들러
  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.trim().length < 1) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(
        `/api/echo/search-patient?hos_id=${hosId}&q=${encodeURIComponent(query)}`,
      )
      const data = await res.json()
      setSearchResults(data)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 기존 환자 선택 → 차트 생성
  function handleSelectPatient(patient: SearchedPatient) {
    startTransition(async () => {
      const echoId = await registerEchoChart({
        hosId,
        patientId: patient.patient_id,
        examDate,
        vetId: vetId || null,
        examinerId: examinerId || null,
        userTags,
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
      router.push(`/hospital/${hosId}/echocardio/${examDate}/${echoId}`)
    })
  }

  // 신규 환자 등록 → 차트 생성
  function handleRegisterNew() {
    if (!newPatient.name || !newPatient.birth || !newPatient.hos_patient_id)
      return
    startTransition(async () => {
      const echoId = await registerPatientAndEchoChart({
        hosId,
        examDate,
        vetId: vetId || null,
        examinerId: examinerId || null,
        userTags,
        patient: newPatient,
      })
      onRegistered()
      router.push(`/hospital/${hosId}/echocardio/${examDate}/${echoId}`)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-white p-4 shadow-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">심초 차트 등록</span>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* 공통: 검사일 / 담당의 / 검사자 */}
        <div className="flex flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-2">
            <label className="w-16 shrink-0 text-xs text-muted-foreground">
              검사일
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="flex-1 rounded border px-2 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 shrink-0 text-xs text-muted-foreground">
              담당의
            </label>
            <select
              value={vetId}
              onChange={(e) => setVetId(e.target.value)}
              className="flex-1 rounded border px-2 py-1 text-xs"
            >
              <option value="">선택 안 함</option>
              {vetsList.map((v) => (
                <option key={v.user_id} value={v.user_id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 shrink-0 text-xs text-muted-foreground">
              검사자
            </label>
            <select
              value={examinerId}
              onChange={(e) => setExaminerId(e.target.value)}
              className="flex-1 rounded border px-2 py-1 text-xs"
            >
              <option value="">선택 안 함</option>
              {vetsList.map((v) => (
                <option key={v.user_id} value={v.user_id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 shrink-0 text-xs text-muted-foreground">
              태그
            </label>
            <input
              type="text"
              value={userTags}
              onChange={(e) => setUserTags(e.target.value)}
              placeholder="쉼표로 구분 (예: 심잡음, 재검)"
              className="flex-1 rounded border px-2 py-1 text-xs"
            />
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 border-b">
          {(['search', 'new'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs ${
                tab === t
                  ? 'border-b-2 border-black font-bold'
                  : 'text-muted-foreground'
              }`}
            >
              {t === 'search' ? '환자 검색' : '신규 등록'}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {tab === 'search' ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="환자명, 차트번호 검색"
              className="rounded border px-2 py-1.5 text-xs"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto">
              {isSearching && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  검색 중...
                </p>
              )}
              {!isSearching && searchResults.length === 0 && searchQuery && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  검색 결과 없음
                </p>
              )}
              {searchResults.map((p) => (
                <button
                  key={p.patient_id}
                  onClick={() => handleSelectPatient(p)}
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">
                    {p.species} · {p.breed} · {p.hos_patient_id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {[
              { label: '환자명*', key: 'name', type: 'text' },
              { label: '차트번호*', key: 'hos_patient_id', type: 'text' },
              { label: '생년월일*', key: 'birth', type: 'date' },
              { label: '보호자명', key: 'owner_name', type: 'text' },
              { label: '품종', key: 'breed', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="w-16 shrink-0 text-xs text-muted-foreground">
                  {label}
                </label>
                <input
                  type={type}
                  value={newPatient[key as keyof typeof newPatient]}
                  onChange={(e) =>
                    setNewPatient((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="flex-1 rounded border px-2 py-1 text-xs"
                />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-xs text-muted-foreground">
                종
              </label>
              <select
                value={newPatient.species}
                onChange={(e) =>
                  setNewPatient((prev) => ({ ...prev, species: e.target.value }))
                }
                className="flex-1 rounded border px-2 py-1 text-xs"
              >
                <option value="canine">개</option>
                <option value="feline">고양이</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-xs text-muted-foreground">
                성별
              </label>
              <select
                value={newPatient.gender}
                onChange={(e) =>
                  setNewPatient((prev) => ({ ...prev, gender: e.target.value }))
                }
                className="flex-1 rounded border px-2 py-1 text-xs"
              >
                <option value="M">수컷</option>
                <option value="F">암컷</option>
                <option value="MN">중성(수)</option>
                <option value="FN">중성(암)</option>
              </select>
            </div>

            <button
              onClick={handleRegisterNew}
              disabled={
                isPending ||
                !newPatient.name ||
                !newPatient.birth ||
                !newPatient.hos_patient_id
              }
              className="mt-1 rounded bg-black py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {isPending ? '등록 중...' : '차트 등록'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
