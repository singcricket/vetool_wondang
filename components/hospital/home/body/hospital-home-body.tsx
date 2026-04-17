'use client'
import { createClient } from '@/lib/supabase/client'
import { fetchHospitalMetadata } from '@/lib/services/hospital-home/todo'
import { HospitalMetadata } from './todo/todo'
import { useEffect, useState } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import Todo from './todo/todo'
import Notice from './notice/notice'
import TimeTable from './schedule/time-table'

export default function HospitalHomeBody({ hosId }: { hosId: string }) {
  const [metadata, setMetadata] = useState<HospitalMetadata | null>(null)
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // 공유 필터 상태 정의
  const [activeFilter, setActiveFilter] = useState<'all' | 'done' | 'not-done'>(
    'all',
  )
  const [selectedUserFilter, setSelectedUserFilter] = useState<string[]>([])

  // 로컬 스토리지 공유 키
  const SHARED_FILTER_KEY = `hospital_shared_filter_${hosId}`
  const SHARED_USER_FILTER_KEY = `hospital_shared_user_filter_${hosId}`

  // 초기 데이터 로드 (Metadata, Auth, Saved Filters)
  useEffect(() => {
    const initializeDashboard = async () => {
      if (!hosId) return

      try {
        const supabase = createClient()
        const [fetchedMetadata, authData] = await Promise.all([
          fetchHospitalMetadata(hosId),
          supabase.auth.getUser(),
        ])

        const user = authData.data.user
        setLoggedInUserId(user?.id || null)
        
        if (fetchedMetadata) {
          setMetadata(fetchedMetadata as HospitalMetadata)
        }

        // 로컬 스토리지 데이터 로드
        const savedFilter = localStorage.getItem(SHARED_FILTER_KEY)
        const savedUserFilter = localStorage.getItem(SHARED_USER_FILTER_KEY)

        if (savedFilter) {
          setActiveFilter(savedFilter as 'all' | 'done' | 'not-done')
        }

        if (savedUserFilter) {
          try {
            setSelectedUserFilter(JSON.parse(savedUserFilter))
          } catch (e) {
            console.error('Failed to parse shared hospital filter:', e)
          }
        } else if (user?.id && fetchedMetadata) {
          // 저장된 필터가 없는 경우 기본값 가공
          const userObj = fetchedMetadata.users.find((u) => u.user_id === user.id)
          const isMaster = userObj?.is_admin === true
          const myGroups = userObj?.group || []

          // 기본 필터: [Me, Unassigned, My Posts]
          const defaultFilter = [user.id, '미지정', '__created_by_me__']

          // 마스터면 모든 그룹 추가, 아니면 내 그룹만 추가
          if (isMaster) {
            defaultFilter.push(...fetchedMetadata.groups)
          } else {
            defaultFilter.push(...myGroups)
          }

          setSelectedUserFilter([...new Set(defaultFilter)])
        }
      } catch (error) {
        console.error('Failed to initialize HospitalHome dashboard:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeDashboard()
  }, [hosId])

  // 필터 변경 시 자동 저장
  useEffect(() => {
    if (isInitializing) return
    localStorage.setItem(SHARED_FILTER_KEY, activeFilter)
  }, [activeFilter, isInitializing, SHARED_FILTER_KEY])

  useEffect(() => {
    if (isInitializing) return
    localStorage.setItem(
      SHARED_USER_FILTER_KEY,
      JSON.stringify(selectedUserFilter),
    )
  }, [selectedUserFilter, isInitializing, SHARED_USER_FILTER_KEY])

  if (isInitializing || !metadata) {
    return <div className="flex h-96 items-center justify-center">Loading...</div>
  }


  return (
    <div className="flex w-full flex-col gap-2 p-2 pt-6">
      <Tabs defaultValue="notice" className="w-full">
        <TabsList className="grid h-12 w-full grid-cols-3 rounded-xl bg-muted/40 p-1.5 shadow-inner">
          <TabsTrigger
            value="notice"
            className="rounded-lg text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            메모/공지
          </TabsTrigger>
          <TabsTrigger
            value="todo"
            className="rounded-lg text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            할일
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="rounded-lg text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            시간표
          </TabsTrigger>
        </TabsList>
        <TabsContent value="todo" className="mt-4">
          <Todo
            hosId={hosId}
            metadata={metadata}
            loggedInUserId={loggedInUserId || ''}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            selectedUserFilter={selectedUserFilter}
            setSelectedUserFilter={setSelectedUserFilter}
          />
        </TabsContent>
        <TabsContent value="notice" className="mt-4">
          <Notice
            hosId={hosId}
            metadata={metadata}
            loggedInUserId={loggedInUserId || ''}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            selectedUserFilter={selectedUserFilter}
            setSelectedUserFilter={setSelectedUserFilter}
          />
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <TimeTable
            hosId={hosId}
            metadata={metadata}
            loggedInUserId={loggedInUserId || ''}
            selectedUserFilter={selectedUserFilter}
            setSelectedUserFilter={setSelectedUserFilter}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
