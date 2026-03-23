'use client'

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { Image } from '@tiptap/extension-image'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
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
  RedoIcon,
  TableIcon,
  ImageIcon,
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  HighlighterIcon
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { useRef, useState, useEffect } from 'react'
import { uploadNoteImage } from '@/lib/services/notes/upload-note-image'
import { toast } from 'sonner'

interface Props {
  content: any
  onChange?: (content: any) => void
  hosId: string
  editable?: boolean
}

const MenuButton = ({ 
  onClick, 
  active = false, 
  disabled = false, 
  title,
  children 
}: { 
  onClick: () => void, 
  active?: boolean, 
  disabled?: boolean, 
  title?: string,
  children: React.ReactNode 
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    title={title}
    className={cn(
      'h-8 w-8 p-0 rounded-md transition-all',
      active ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    )}
  >
    {children}
  </Button>
)

// Custom NodeView for Image Resizing
const ImageComponent = ({ node, updateAttributes, editor }: any) => {
  const [resizing, setResizing] = useState(false)
  const [width, setWidth] = useState(node.attrs.width || '100%')
  const imageRef = useRef<HTMLImageElement>(null)
  
  // Get editable state from editor
  const isEditable = editor.isEditable

  const onMouseDown = (event: React.MouseEvent) => {
    if (!isEditable) return
    
    event.preventDefault()
    setResizing(true)

    const startX = event.clientX
    const startWidth = imageRef.current?.getBoundingClientRect().width || 0
    const parentWidth = imageRef.current?.parentElement?.parentElement?.getBoundingClientRect().width || 1

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX
      const newWidthPx = startWidth + (currentX - startX)
      const newWidthPercent = Math.min(Math.max((newWidthPx / parentWidth) * 100, 10), 100)
      
      const roundedWidth = `${Math.round(newWidthPercent)}%`
      setWidth(roundedWidth)
    }

    const onMouseUp = () => {
      setResizing(false)
      updateAttributes({ width })
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Update local width when node attributes change
  useEffect(() => {
    setWidth(node.attrs.width || '100%')
  }, [node.attrs.width])

  return (
    <NodeViewWrapper className="relative inline-block leading-none group" style={{ width }}>
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        title={node.attrs.title}
        className={cn(
          "rounded-lg shadow-md border border-slate-200 transition-shadow",
          resizing ? "ring-2 ring-blue-500 shadow-xl" : (isEditable ? "group-hover:ring-2 group-hover:ring-blue-300" : "")
        )}
        style={{ width: '100%', height: 'auto' }}
      />
      
      {/* Resize Handle - Only show if editable */}
      {isEditable && (
        <div
          className={cn(
            "absolute bottom-2 right-2 w-4 h-4 bg-blue-600 rounded-sm cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg pointer-events-auto z-10",
            resizing && "opacity-100 scale-125"
          )}
          onMouseDown={onMouseDown}
        >
          <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-white" />
        </div>
      )}

      {/* Size Indicator */}
      {(resizing || (isEditable && node.attrs.width)) && (
        <div className="absolute top-2 right-2 bg-slate-900/75 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          {width}
        </div>
      )}
    </NodeViewWrapper>
  )
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => element.style.width,
        renderHTML: attributes => {
          return {
            style: `width: ${attributes.width}; max-width: 100%;`,
          }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent)
  },
})

export default function NotesEditor({ content, onChange, hosId, editable = true }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ResizableImage.configure({
        allowBase64: true,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    editable: editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: cn(
           'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none max-w-none px-4 py-8 sm:px-8 bg-white break-words overflow-x-auto',
           editable ? 'min-h-[600px]' : ''
        )
      }
    }
  }, [editable])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editor) return

    const toastId = toast.loading('이미지를 업로드 중입니다...')
    try {
      const { url, error } = await uploadNoteImage(file, hosId)
      if (error) throw new Error(error)
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
        toast.success('이미지가 삽입되었습니다.', { id: toastId })
      }
    } catch (error: any) {
      toast.error(`업로드 실패: ${error.message}`, { id: toastId })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (editor && content && editor.isEmpty) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  if (!editor) return null

  return (
    <div className={cn(
       "w-full overflow-x-auto bg-white",
       editable ? "border border-slate-200 rounded-2xl shadow-sm ring-1 ring-slate-100" : ""
    )}>
      {/* Toolbar - Only if editable */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200 sticky top-0 z-20 backdrop-blur-sm">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="굵게"
          >
            <BoldIcon size={16} strokeWidth={2.5} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="기울임"
          >
            <ItalicIcon size={16} strokeWidth={2.5} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive('highlight')}
            title="하이라이트"
          >
            <HighlighterIcon size={16} strokeWidth={2.5} />
          </MenuButton>
          
          <div className="w-px h-6 bg-slate-300 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="제목 1"
          >
            <Heading1Icon size={16} strokeWidth={2.5} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="제목 2"
          >
            <Heading2Icon size={16} strokeWidth={2.5} />
          </MenuButton>

          <div className="w-px h-6 bg-slate-300 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="왼쪽 정렬"
          >
            <AlignLeftIcon size={16} strokeWidth={2.5} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="가운데 정렬"
          >
            <AlignCenterIcon size={16} strokeWidth={2.5} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="오른쪽 정렬"
          >
            <AlignRightIcon size={16} strokeWidth={2.5} />
          </MenuButton>

          <div className="w-px h-6 bg-slate-300 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="불렛 리스트"
          >
            <ListIcon size={16} strokeWidth={2.5} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="번호 리스트"
          >
            <ListOrderedIcon size={16} strokeWidth={2.5} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="인용"
          >
            <QuoteIcon size={16} strokeWidth={2.5} />
          </MenuButton>

          <div className="w-px h-6 bg-slate-300 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="표 삽입"
          >
            <TableIcon size={16} strokeWidth={2.5} />
          </MenuButton>

          <MenuButton
            onClick={() => fileInputRef.current?.click()}
            title="이미지 업로드"
          >
            <ImageIcon size={16} strokeWidth={2.5} />
          </MenuButton>
          <input 
            type="file" 
            hidden 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleImageUpload}
          />

          <div className="flex-1" />

          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="실행 취소"
          >
            <UndoIcon size={16} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="다시 실행"
          >
            <RedoIcon size={16} />
          </MenuButton>
        </div>
      )}

      {/* Table Action Bar */}
      {editable && editor.isActive('table') && (
         <div className="flex flex-wrap items-center gap-1 p-2 bg-blue-50/50 border-b border-blue-100 animate-in slide-in-from-top-2">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => editor.chain().focus().addColumnBefore().run()}>열 추가(앞)</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => editor.chain().focus().addColumnAfter().run()}>열 추가(뒤)</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => editor.chain().focus().deleteColumn().run()}>열 삭제</Button>
            <div className="w-px h-4 bg-blue-200 mx-1" />
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => editor.chain().focus().addRowBefore().run()}>행 추가(위)</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => editor.chain().focus().addRowAfter().run()}>행 추가(아래)</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => editor.chain().focus().deleteRow().run()}>행 삭제</Button>
            <div className="w-px h-4 bg-blue-200 mx-1" />
            <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => editor.chain().focus().deleteTable().run()}>표 삭제</Button>
         </div>
      )}

      {/* Editor Content */}
      <div className={cn(
        "relative cursor-text bg-white",
        editable ? "min-h-[600px]" : "cursor-default"
      )} onClick={() => editable && editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .ProseMirror td, .ProseMirror th {
          min-width: 1em;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: #f8fafc;
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #3b82f6;
          pointer-events: none;
        }
        /* Style for selected nodes */
        .ProseMirror-selectednode {
          outline: none;
        }
        .ProseMirror img {
            display: inline-block;
            vertical-align: bottom;
        }
      `}</style>
    </div>
  )
}
