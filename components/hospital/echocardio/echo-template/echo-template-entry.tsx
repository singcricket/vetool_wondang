'use client'

import DataTable from '@/components/ui/data-table'
import type { EchoTemplate } from '@/types/echocardio/echocardio-type'
import { echoTemplateColumns } from './echo-template-columns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UpsertEchoCanineTemplateDialog from './upsert-echo-canine-template-dialog'
import UpsertEchoFelineTemplateDialog from './upsert-echo-feline-template-dialog'

type Props = {
  templates: EchoTemplate[]
  hosId: string
  testUIMeta: any[]
}

export default function EchoTemplateEntry({
  templates,
  hosId,
  testUIMeta,
}: Props) {
  const dogTemplates = templates.filter((t) => t.template_species === 'canine')
  const catTemplates = templates.filter((t) => t.template_species === 'feline')

  return (
    <div className="p-2 pt-0">
      <Tabs defaultValue="canine" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1 max-w-[280px] mb-6 rounded-lg border border-slate-200 shadow-sm">
          <TabsTrigger
            value="canine"
            className="px-4 py-1.5 text-xs font-bold transition-all rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-500 hover:text-blue-600"
          >
            DOG 개
          </TabsTrigger>
          <TabsTrigger
            value="feline"
            className="px-4 py-1.5 text-xs font-bold transition-all rounded-md data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-500 hover:text-orange-600"
          >
            CAT 고양이
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canine" className="mt-0 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              개 (DOG) 전용 템플릿
            </h3>
            <UpsertEchoCanineTemplateDialog
              isEdit={false}
              hosId={hosId}
              testUIMeta={testUIMeta}
            />
          </div>
          <DataTable
            searchPlaceHolder="템플릿 이름 · 설명 검색"
            data={dogTemplates}
            columns={echoTemplateColumns(hosId, testUIMeta)}
            rowLength={10}
          />
        </TabsContent>

        <TabsContent value="feline" className="mt-0 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              고양이 (CAT) 전용 템플릿
            </h3>
            <UpsertEchoFelineTemplateDialog
              isEdit={false}
              hosId={hosId}
              testUIMeta={testUIMeta}
            />
          </div>
          <DataTable
            searchPlaceHolder="템플릿 이름 · 설명 검색"
            data={catTemplates}
            columns={echoTemplateColumns(hosId, testUIMeta)}
            rowLength={10}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
