import NotesSidebar from '@/components/hospital/notes/notes-sidebar/notes-sidebar'
import NotesFooter from '@/components/hospital/notes/notes-footer/notes-footer'

export default async function NotesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ hos_id: string }>
}) {
  const { hos_id } = await params

  return (
    <div className="flex h-desktop">
      {/* Left Sidebar: Categories */}
      <NotesSidebar hosId={hos_id} />

      {/* Main Content Area */}
      <div className="ml-0 w-screen flex-1 overflow-y-auto h-desktop 2xl:ml-64 2xl:w-auto pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>

      {/* Bottom Footer Meta Menu */}
      <NotesFooter hosId={hos_id} />
    </div>
  )
}
