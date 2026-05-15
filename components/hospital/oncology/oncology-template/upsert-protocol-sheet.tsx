'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { PencilIcon, PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ProtocolEditor from '@/components/hospital/oncology/protocol-editor/protocol-editor'
import type { ProtocolFormData } from '@/lib/actions/oncology/protocol-template-actions'
import { createFullProtocol, updateFullProtocol } from '@/lib/actions/oncology/protocol-template-actions'
import type { AiProtocolOption } from '@/lib/actions/oncology/ai-oncology-guide'

type Props =
  | { mode: 'create'; hosId: string; diagnosisKey?: string }
  | { mode: 'edit'; hosId: string; protocol: AiProtocolOption }

export default function UpsertProtocolSheet(props: Props) {
  const { refresh } = useRouter()
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isEdit = props.mode === 'edit'

  const initialData: Partial<ProtocolFormData> | undefined = isEdit
    ? {
        protocol_name: props.protocol.protocol_name,
        protocol_type: props.protocol.protocol_type,
        phase: props.protocol.phase,
        total_cycles: props.protocol.total_cycles,
        total_weeks: props.protocol.total_weeks,
        description: props.protocol.description,
        mst_days: props.protocol.mst_days,
        response_rate: props.protocol.response_rate,
        precautions: props.protocol.precautions,
        contraindications: props.protocol.contraindications,
        owner_instructions: props.protocol.owner_instructions,
        owner_warning_signs: props.protocol.owner_warning_signs,
        drugs: props.protocol.drugs,
        adverse_effects: props.protocol.adverse_effects,
        ref_sources: props.protocol.ref_sources,
        user_tags: props.protocol.user_tags ?? '',
      }
    : undefined

  const handleSubmit = async (data: ProtocolFormData) => {
    setIsSaving(true)
    try {
      if (isEdit) {
        await updateFullProtocol(props.protocol.id!, data)
        toast.success('프로토콜을 수정하였습니다')
      } else {
        await createFullProtocol(props.hosId, props.diagnosisKey ?? '', data)
        toast.success('프로토콜을 생성하였습니다')
      }
      setOpen(false)
      refresh()
    } catch (e: any) {
      toast.error(e?.message ?? '저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon">
            <PencilIcon size={16} />
          </Button>
        ) : (
          <Button size="sm" className="flex items-center gap-1">
            <PlusIcon size={14} />
            프로토콜 추가
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{isEdit ? '프로토콜 수정' : '새 프로토콜 추가'}</SheetTitle>
        </SheetHeader>

        <div className="px-6 pb-6">
          <ProtocolEditor
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            submitLabel={isEdit ? '저장' : '추가'}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
