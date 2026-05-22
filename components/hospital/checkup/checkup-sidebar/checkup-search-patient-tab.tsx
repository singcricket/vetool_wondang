'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { searchPatients } from '@/lib/services/patient/patient'
import DataTable from '@/components/ui/data-table'
import LargeLoaderCircle from '@/components/common/large-loader-circle'
import TotalPatientCount from '@/components/common/patients/search/total-paitent-count'
import type { Patient } from '@/types'
import { checkupSearchedPatientColumns } from './checkup-searched-patient-columns'

interface Props {
  hosId: string
  targetDate: string
  setOpen: Dispatch<SetStateAction<boolean>>
  onRegistered: () => void
}

export default function CheckupSearchPatientTab({ hosId, targetDate, setOpen, onRegistered }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    debouncedSearch()
  }

  const debouncedSearch = useDebouncedCallback(async () => {
    if (searchTerm.trim()) {
      setIsSearching(true)
      const data = await searchPatients(
        searchTerm.split(',').map((s) => s.trim()),
        hosId,
      )
      setPatients(data)
      setIsSearching(false)
    }
  }, 500)

  return (
    <div className="flex h-[540px] flex-col gap-2">
      <div className="relative w-full">
        <Input
          placeholder="환자 번호, 환자명, 보호자명으로 검색하세요."
          value={searchTerm}
          onChange={handleInputChange}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:bg-transparent"
          onClick={() => {
            setSearchTerm('')
            setPatients([])
          }}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full text-right text-sm text-muted-foreground relative h-6">
        <TotalPatientCount hosId={hosId} />
      </div>

      <div className="relative h-full overflow-hidden border rounded-md">
        {isSearching ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <LargeLoaderCircle />
          </div>
        ) : (
          <DataTable
            columns={checkupSearchedPatientColumns({
              hosId,
              targetDate,
              setIsRegisterDialogOpen: setOpen,
              onRegistered,
            })}
            data={patients}
          />
        )}
      </div>
    </div>
  )
}
