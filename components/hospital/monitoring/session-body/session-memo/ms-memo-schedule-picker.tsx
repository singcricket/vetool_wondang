import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { MemoScheduleType, MsMemo, MsMemoSchedule } from '@/types/monitoring/monitoring-type'
import { ClockIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

type Props = {
  schedule?: MsMemoSchedule
  onScheduleChange: (schedule: MsMemoSchedule | undefined) => void
  memos: MsMemo[]
  currentMemoId?: string // To exclude self from the target list if editing
  msData: MsWithPatientWithWeight
}

export default function MsMemoSchedulePicker({
  schedule,
  onScheduleChange,
  memos,
  currentMemoId,
  msData,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MemoScheduleType>(
    schedule?.type || 'after_start',
  )
  const [absTime, setAbsTime] = useState(
    schedule?.type === 'absolute' ? String(schedule.value) : '',
  )
  const [relativeMin, setRelativeMin] = useState(
    schedule?.type !== 'absolute' ? String(schedule?.value || '') : '',
  )
  const [targetMemoId, setTargetMemoId] = useState<string>(
    schedule?.target_memo_id || '',
  )

  const handleApply = () => {
    let newSchedule: MsMemoSchedule | undefined

    if (activeTab === 'absolute') {
      if (absTime) {
        newSchedule = { type: 'absolute', value: absTime }
      }
    } else if (activeTab === 'after_start') {
      if (relativeMin) {
        newSchedule = { type: 'after_start', value: Number(relativeMin) }
      }
    } else if (activeTab === 'after_prev') {
      if (relativeMin && targetMemoId) {
        newSchedule = {
          type: 'after_prev',
          value: Number(relativeMin),
          target_memo_id: targetMemoId,
        }
      }
    }

    onScheduleChange(newSchedule)
    setIsOpen(false)
  }

  const handleClear = () => {
    onScheduleChange(undefined)
    setAbsTime('')
    setRelativeMin('')
    setTargetMemoId('')
    setIsOpen(false)
  }

  // 필터링: 자기 자신 제외, 처치 계획 메모만 선택 가능
  const availableTargetMemos = memos.filter(
    (m) => m.id !== currentMemoId && !m.is_realtime_memo,
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={schedule ? 'default' : 'outline'}
          size="icon"
          className="h-7 w-7 rounded-md"
          title="시간 예약"
        >
          <ClockIcon size={14} className={schedule ? 'text-white' : 'text-blue-500'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">예정 시간 설정</h4>
            {schedule && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={handleClear}
                title="예약 초기화"
              >
                <XIcon size={14} />
              </Button>
            )}
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as MemoScheduleType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-8 text-[11px]">
              <TabsTrigger value="after_start" className="text-[11px] px-1">시작 후</TabsTrigger>
              <TabsTrigger value="after_prev" className="text-[11px] px-1">처치 후</TabsTrigger>
              <TabsTrigger value="absolute" className="text-[11px] px-1">지정 시간</TabsTrigger>
            </TabsList>

            <TabsContent value="after_start" className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="예: 30"
                  value={relativeMin}
                  onChange={(e) => setRelativeMin(e.target.value)}
                  className="h-8"
                  min={0}
                />
                <span className="shrink-0 text-sm text-muted-foreground">분 뒤</span>
              </div>
            </TabsContent>

            <TabsContent value="after_prev" className="mt-2 space-y-2">
              <Select value={targetMemoId} onValueChange={setTargetMemoId}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="기준 처치 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargetMemos.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                      선택할 수 있는 처치가 없습니다
                    </div>
                  ) : (
                    availableTargetMemos.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.memo.length > 20 ? m.memo.slice(0, 20) + '...' : m.memo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="예: 15"
                  value={relativeMin}
                  onChange={(e) => setRelativeMin(e.target.value)}
                  className="h-8"
                  min={0}
                />
                <span className="shrink-0 text-sm text-muted-foreground">분 뒤</span>
              </div>
            </TabsContent>

            <TabsContent value="absolute" className="mt-2 space-y-2">
              <Input
                type="time"
                value={absTime}
                onChange={(e) => setAbsTime(e.target.value)}
                className="h-8"
              />
            </TabsContent>
          </Tabs>

          <Button size="sm" onClick={handleApply} className="w-full">
            적용
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
