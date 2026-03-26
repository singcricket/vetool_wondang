'use client'

import React, { useState } from 'react'
import { Folder, FileText, Activity, Menu, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'

interface Props {
  collection: any
  items: any[]
  children: React.ReactNode
}

export default function SharedCollectionLayout({ collection, items, children }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // React.Children.toArray safely converts children into an array we can index into
  const childArray = React.Children.toArray(children)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden absolute inset-0">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center gap-3 shrink-0 z-20 shadow-md">
        <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-slate-800 rounded">
          <Menu size={24} />
        </button>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Vetool Collection</span>
          <span className="font-bold truncate leading-none">{collection.title}</span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed md:relative inset-y-0 left-0 z-40 w-[280px] sm:w-[320px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 shadow-xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-5 border-b border-slate-100 flex flex-col gap-2 shrink-0 bg-slate-50">
          <div className="flex items-center justify-between md:hidden mb-2">
            <span className="font-bold text-slate-400 text-xs">목차 닫기</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 bg-white rounded-md shadow-sm border text-slate-500 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm text-white">
              <Folder size={16} />
            </div>
            <Link href="/" className="text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-widest">
              Vetool Shared
            </Link>
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-800 leading-tight">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              {collection.description}
            </p>
          )}
          
          <div className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded w-fit mt-2">
            총 {items.length}개의 항목
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item, idx) => {
            const isSelected = selectedIndex === idx
            return (
              <button
                key={`${item.resource_type}-${item.resource_id}`}
                onClick={() => {
                  setSelectedIndex(idx)
                  setIsSidebarOpen(false)
                }}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all border group",
                  isSelected 
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                )}>
                  {item.resource_type === 'note' ? <FileText size={14} /> : <Activity size={14} />}
                </div>
                <div className="flex flex-col flex-1 min-w-0 py-0.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isSelected ? "text-blue-600" : "text-slate-400"
                    )}>
                      {item.resource_type === 'note' ? '진료 노트' : '모니터링'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 group-hover:text-slate-400">#{idx + 1}</span>
                  </div>
                  <span className={cn(
                    "text-sm font-bold truncate",
                    isSelected ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"
                  )}>
                    {item.displayTitle}
                  </span>
                </div>
                {isSelected && (
                  <ChevronRight size={16} className="text-blue-500 shrink-0 self-center opacity-50" />
                )}
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full md:h-screen overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <Folder size={48} className="text-slate-300 mb-4" />
            <p className="font-bold text-lg text-slate-700">빈 컬렉션입니다</p>
            <p className="text-sm mt-2">이 컬렉션에는 아직 포함된 문서가 없습니다.</p>
          </div>
        ) : (
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both pb-12 w-full max-w-5xl mx-auto">
            {childArray[selectedIndex]}
          </div>
        )}
      </main>

    </div>
  )
}
