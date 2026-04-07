'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { setDefaultTemplate } from '@/lib/services/echocardio/update-echo'
import type { EchoTemplate } from '@/types/echocardio/echocardio-type'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDownIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils/utils'
import DeleteEchoTemplateDialog from './delete-echo-template-dialog'
import UpsertEchoCanineTemplateDialog from './upsert-echo-canine-template-dialog'
import UpsertEchoFelineTemplateDialog from './upsert-echo-feline-template-dialog'

function ActiveCell({ template, hosId }: { template: EchoTemplate; hosId: string }) {
  const { refresh } = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleSetDefault() {
    if (template.is_default) return
    setIsPending(true)
    await setDefaultTemplate(hosId, template.id)
    refresh()
    setIsPending(false)
  }

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <input
          type="radio"
          checked={template.is_default}
          onChange={handleSetDefault}
          className="h-3.5 w-3.5 cursor-pointer"
        />
      )}
      {template.is_default && (
        <span className="rounded bg-black px-1.5 py-0.5 text-[10px] text-white">활성</span>
      )}
    </div>
  )
}

export const echoTemplateColumns = (hosId: string, testUIMeta: any[]): ColumnDef<EchoTemplate>[] => [
  {
    id: 'is_default',
    header: '활성',
    size: 80,
    cell: ({ row }) => <ActiveCell template={row.original} hosId={hosId} />,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="default"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        템플릿 이름
        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'template_species',
    header: '종',
    size: 50,
    cell: ({ row }) => (
      <span className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        row.original.template_species === 'feline' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
      )}>
        {row.original.template_species === 'feline' ? 'CAT' : 'DOG'}
      </span>
    )
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="default"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        설명
        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description ?? '-'}</span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="default"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        생성일
        <ArrowUpDownIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('ko-KR') : '-'}
      </span>
    ),
  },
  {
    id: 'edit',
    header: '수정',
    size: 50,
    cell: ({ row }) => {
      const template = row.original
      if (template.template_species === 'feline') {
        return (
          <UpsertEchoFelineTemplateDialog
            isEdit
            hosId={hosId}
            template={template}
            testUIMeta={testUIMeta}
          />
        )
      }
      return (
        <UpsertEchoCanineTemplateDialog
          isEdit
          hosId={hosId}
          template={template}
          testUIMeta={testUIMeta}
        />
      )
    },
  },
  {
    id: 'delete',
    header: '삭제',
    size: 50,
    cell: ({ row }) => {
      if (row.original.is_default) return null
      return (
        <DeleteEchoTemplateDialog
          templateName={row.original.name}
          templateId={row.original.id}
        />
      )
    },
  },
]
