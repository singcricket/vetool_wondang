import { Node, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { FileTextIcon, Trash2Icon, ExternalLinkIcon, DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils/utils'

const PdfComponent = (props: any) => {
  const { node, deleteNode, editor, updateAttributes } = props
  const { src, height, width, fileName } = node.attrs
  const isEditable = editor.isEditable
  const [resizing, setResizing] = useState<string | null>(null)
  const [currentWidth, setCurrentWidth] = useState(width || '100%')
  const [currentHeight, setCurrentHeight] = useState(height || '600px')
  const containerRef = useRef<HTMLDivElement>(null)
  
  const latestWidth = useRef(width || '100%')
  const latestHeight = useRef(height || '600px')

  const onMouseDown = (event: React.MouseEvent, mode: 'width' | 'height' | 'both') => {
    if (!isEditable) return
    
    event.preventDefault()
    setResizing(mode)

    const startX = event.clientX
    const startY = event.clientY
    const startWidthPx = containerRef.current?.getBoundingClientRect().width || 0
    const startHeightPx = containerRef.current?.getBoundingClientRect().height || 0
    const parentWidth = containerRef.current?.parentElement?.parentElement?.getBoundingClientRect().width || 1

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX
      const currentY = moveEvent.clientY
      
      let newWidth = latestWidth.current
      let newHeight = latestHeight.current

      // Horizontal Resizing
      if (mode === 'width' || mode === 'both') {
        const dx = currentX - startX
        const newWidthPxValue = startWidthPx + dx
        const newWidthPercent = Math.min(Math.max((newWidthPxValue / parentWidth) * 100, 10), 100)
        newWidth = `${Math.round(newWidthPercent)}%`
      }

      // Vertical Resizing
      if (mode === 'height' || mode === 'both') {
        const dy = currentY - startY
        const newHeightPxValue = Math.max(startHeightPx + dy, 100)
        newHeight = `${Math.round(newHeightPxValue)}px`
      }

      latestWidth.current = newWidth
      latestHeight.current = newHeight
      setCurrentWidth(newWidth)
      setCurrentHeight(newHeight)
    }

    const onMouseUp = () => {
      setResizing(null)
      updateAttributes({ 
        width: latestWidth.current, 
        height: latestHeight.current 
      })
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  useEffect(() => {
    setCurrentWidth(node.attrs.width || '100%')
    setCurrentHeight(node.attrs.height || '600px')
    latestWidth.current = node.attrs.width || '100%'
    latestHeight.current = node.attrs.height || '600px'
  }, [node.attrs.width, node.attrs.height])

  // Google Docs Viewer URL
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`

  return (
    <NodeViewWrapper className="pdf-embed-node my-6 group w-full block" style={{ width: currentWidth }}>
      <div 
        ref={containerRef}
        className={cn(
            "relative flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-800 transition-all",
            resizing ? "ring-2 ring-blue-500 shadow-2xl" : "group-hover:ring-1 group-hover:ring-slate-700"
        )}
        style={{ height: currentHeight }}
      >
        {/* Stylish Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 shrink-0 z-10">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400">
                    <FileTextIcon size={18} />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-slate-100 truncate uppercase tracking-widest">PDF Viewer</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-[400px]">{fileName || 'Untitled Document'}</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <a 
                  href={src} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                  title="PDF 다운로드"
                >
                    <DownloadIcon size={16} />
                </a>
                <a 
                  href={src} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                  title="새 창에서 열기"
                >
                    <ExternalLinkIcon size={16} />
                </a>
                
                {isEditable && (
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            deleteNode()
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="삭제"
                    >
                        <Trash2Icon size={16} />
                    </button>
                )}
            </div>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 w-full bg-slate-100 relative overflow-hidden">
            <iframe
            src={viewerUrl}
            className="w-full h-full border-none"
            title="PDF Preview"
            loading="lazy"
            />
            
            {/* Interaction blocker/overlay for dragging */}
            {resizing && <div className="absolute inset-0 z-20 bg-transparent" />}
        </div>

        {/* Resize Handles - Only in Editable Mode */}
        {isEditable && (
            <>
                <div 
                    className={cn(
                        "absolute top-0 -right-1 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 z-30 flex items-center justify-center",
                        resizing === 'width' && "opacity-100"
                    )}
                    onMouseDown={(e) => onMouseDown(e, 'width')}
                >
                    <div className="w-1 h-12 bg-blue-500/50 rounded-full" />
                </div>
                <div 
                    className={cn(
                        "absolute -bottom-1 left-0 w-full h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 z-30 flex items-center justify-center",
                        resizing === 'height' && "opacity-100"
                    )}
                    onMouseDown={(e) => onMouseDown(e, 'height')}
                >
                    <div className="h-1 w-12 bg-blue-500/50 rounded-full" />
                </div>
                <div 
                    className={cn(
                        "absolute -bottom-2 -right-2 w-6 h-6 bg-blue-600 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-all shadow-xl z-40 flex items-center justify-center",
                        resizing === 'both' && "opacity-100 scale-125 bg-blue-700"
                    )}
                    onMouseDown={(e) => onMouseDown(e, 'both')}
                >
                    <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-white" />
                </div>
            </>
        )}
      </div>

      {/* Resize Indicator */}
      {(resizing || isEditable) && (
        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between px-2 font-mono">
            <span>Dimensions: {currentWidth} × {currentHeight}</span>
            {resizing && <span className="text-blue-500 font-bold animate-pulse">RESIZING...</span>}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const PdfEmbed = Node.create({
  name: 'pdfEmbed',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      fileName: {
        default: 'Document',
      },
      width: {
        default: '100%',
      },
      height: {
        default: '600px',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pdf-embed"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['div', { 
        'data-type': 'pdf-embed', 
        style: `width: ${node.attrs.width || '100%'};`,
        ...HTMLAttributes 
    }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PdfComponent)
  },

  addCommands() {
    return {
      setPdf: (options: { src: string; fileName?: string; width?: string; height?: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    } as any
  },
})
