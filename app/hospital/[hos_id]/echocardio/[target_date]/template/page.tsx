import MobileTitle from '@/components/common/mobile-title'
import EchoTemplateEntry from '@/components/hospital/echocardio/echo-template/echo-template-entry'
import { fetchEchoTemplates } from '@/lib/services/echocardio/fetch-echo'
import { getAllEchoTestUIMeta } from '@/constants/hospital/echocardio/echo-tests'
import { BookmarkIcon } from 'lucide-react'

export default async function EchoTemplatePage(props: {
  params: Promise<{ hos_id: string; target_date: string }>
}) {
  const { hos_id } = await props.params
  const [templates, testUIMeta] = await Promise.all([
    fetchEchoTemplates(hos_id),
    Promise.resolve(getAllEchoTestUIMeta()),
  ])

  return (
    <div>
      <MobileTitle icon={BookmarkIcon} title="템플릿" />
      <EchoTemplateEntry templates={templates} hosId={hos_id} testUIMeta={testUIMeta} />
    </div>
  )
}
