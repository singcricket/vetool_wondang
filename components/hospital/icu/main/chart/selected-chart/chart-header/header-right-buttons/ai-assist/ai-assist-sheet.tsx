'use client'

import { useState } from 'react'
import { BotIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LabResultSection from './lab-result-section'
import AiSessionTab from './ai-session-tab'
import type { SelectedIcuChart } from '@/types/icu/chart'

interface Props {
  hosId: string
  icuIoId: string
  icuChartId: string
  patientName: string
  chartData: SelectedIcuChart
}

export default function AiAssistSheet({
  hosId,
  icuIoId,
  icuChartId,
  patientName,
  chartData,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <BotIcon size={14} />
          AI
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-[560px]" side="right">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BotIcon size={16} />
            AI 어시스트 — {patientName}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="lab" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="lab" className="w-full text-xs">검사 결과</TabsTrigger>
            <TabsTrigger value="ai" className="w-full text-xs">AI 추천</TabsTrigger>
          </TabsList>

          <TabsContent value="lab" className="mt-0 flex-1 overflow-hidden">
            <LabResultSection
              hosId={hosId}
              icuIoId={icuIoId}
              icuChartId={icuChartId}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-0 flex-1 overflow-hidden">
            <AiSessionTab hosId={hosId} chartData={chartData} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
