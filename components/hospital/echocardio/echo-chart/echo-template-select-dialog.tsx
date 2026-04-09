'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EchoTemplate } from '@/types/echocardio/echocardio-type'
import { useState } from 'react'
import { cn } from '@/lib/utils/utils'

interface Props {
  templates: EchoTemplate[]
  onSelect: (template: EchoTemplate) => void
  children: React.ReactNode
  disabled?: boolean
}

export default function EchoTemplateSelectDialog({
  templates,
  onSelect,
  children,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)

  const handleSelect = (t: EchoTemplate) => {
    onSelect(t)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>나의 템플릿 선택</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-4">
          {templates.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              등록된 템플릿이 없습니다. <br /> 먼저 템플릿 관리에서 구성해주세요.
            </p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className={cn(
                  'flex flex-col rounded-lg border p-4 text-left transition-all hover:bg-slate-50 hover:border-blue-500',
                )}
              >
                <div className="flex items-center justify-between">
                  {t.is_default && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1">Default</span>
                  )}
                </div>
                <span className="font-bold text-slate-800">{t.name}</span>
                {t.description && (
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {t.description}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
