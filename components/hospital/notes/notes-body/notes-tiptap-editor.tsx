'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { 
  BoldIcon, 
  ItalicIcon, 
  ListIcon, 
  ListOrderedIcon, 
  Heading1Icon, 
  Heading2Icon,
  QuoteIcon,
  UndoIcon,
  RedoIcon
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'

interface Props {
  content: any
  onChange: (content: any) => void
}

const MenuButton = ({ 
  onClick, 
  active = false, 
  disabled = false, 
  children 
}: { 
  onClick: () => void, 
  active?: boolean, 
  disabled?: boolean, 
  children: React.ReactNode 
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'h-8 w-8 p-0 rounded-md transition-all',
      active ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-slate-500 hover:bg-slate-100'
    )}
  >
    {children}
  </Button>
)

export default function NotesTiptapEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none max-w-none min-h-[500px] p-6 bg-white rounded-xl border border-slate-200'
      }
    }
  })

  if (!editor) return null

  return (
    <div className="w-full space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-xl">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <BoldIcon size={16} strokeWidth={2.5} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <ItalicIcon size={16} strokeWidth={2.5} />
        </MenuButton>
        
        <div className="w-px h-4 bg-slate-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        >
          <Heading1Icon size={16} strokeWidth={2.5} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2Icon size={16} strokeWidth={2.5} />
        </MenuButton>

        <div className="w-px h-4 bg-slate-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <ListIcon size={16} strokeWidth={2.5} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrderedIcon size={16} strokeWidth={2.5} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <QuoteIcon size={16} strokeWidth={2.5} />
        </MenuButton>

        <div className="flex-1" />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <UndoIcon size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <RedoIcon size={16} />
        </MenuButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
