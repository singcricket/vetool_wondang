'use client'

import { useEffect, useState } from 'react'
import Notice from './notice/notice'
import Todo from './todo/todo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function HospitalHomeBody({ hosId }: { hosId: string }) {
  // 공유 필터 상태 정의
  const [activeFilter, setActiveFilter] = useState<'all' | 'done' | 'not-done'>(
    'all',
  )
  const [selectedUserFilter, setSelectedUserFilter] = useState<string[]>([])

  // 로컬 스토리지 공유 키
  const SHARED_FILTER_KEY = `hospital_shared_filter_${hosId}`
  const SHARED_USER_FILTER_KEY = `hospital_shared_user_filter_${hosId}`

  // 로컬 스토리지 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
      }
    }
  }, [hosId, SHARED_FILTER_KEY, SHARED_USER_FILTER_KEY])

  // 필터 변경 시 자동 저장
  useEffect(() => {
    localStorage.setItem(SHARED_FILTER_KEY, activeFilter)
  }, [activeFilter, SHARED_FILTER_KEY])

  useEffect(() => {
    localStorage.setItem(SHARED_USER_FILTER_KEY, JSON.stringify(selectedUserFilter))
  }, [selectedUserFilter, SHARED_USER_FILTER_KEY])

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
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            selectedUserFilter={selectedUserFilter}
            setSelectedUserFilter={setSelectedUserFilter}
          />
        </TabsContent>
        <TabsContent value="notice" className="mt-4">
          <Notice 
            hosId={hosId} 
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            selectedUserFilter={selectedUserFilter}
            setSelectedUserFilter={setSelectedUserFilter}
          />
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
            준비 중인 기능입니다.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
