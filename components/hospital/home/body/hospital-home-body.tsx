import Notice from './notice/notice'
import Todo from './todo/todo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function HospitalHomeBody({ hosId }: { hosId: string }) {
  return (
    <div className="flex w-full flex-col gap-2 p-2 pt-6">
      <Tabs defaultValue="todo" className="w-full">
        <TabsList className="grid h-12 w-full grid-cols-3 rounded-xl bg-muted/40 p-1.5 shadow-inner">
          <TabsTrigger
            value="todo"
            className="rounded-lg text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            할일
          </TabsTrigger>
          <TabsTrigger
            value="notice"
            className="rounded-lg text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            공지
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="rounded-lg text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            일정표
          </TabsTrigger>
        </TabsList>
        <TabsContent value="todo" className="mt-4">
          <Todo hosId={hosId} />
        </TabsContent>
        <TabsContent value="notice" className="mt-4">
          <Notice hosId={hosId} />
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
