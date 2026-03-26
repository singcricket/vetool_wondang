'use client'

import NotesEditor from '@/components/hospital/notes/notes-body/notes-create/notes-editor'
import { NoteWithAuthor } from '@/types/notes/notes_index'

interface Props {
  note: NoteWithAuthor
  hosId: string
}

export default function NoteViewClient({ note, hosId }: Props) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto min-h-full overflow-hidden">
      <div className="p-8 sm:p-12 md:p-16">
        <NotesEditor 
          content={note.content} 
          hosId={hosId}
          editable={false}
        />
      </div>
      
      {/* Global styles for the editor in view mode moved to Client Component */}
      <style jsx global>{`
        .ProseMirror {
          padding: 0 !important;
        }
        .ProseMirror-focused {
          outline: none !important;
        }
      `}</style>
    </div>
  )
}
