import MobileTitle from "@/components/common/mobile-title"
import MsTemplateEntry from "@/components/hospital/monitoring/session-template/ms-template-entry"
import UpsertMsTemplateDialog from "@/components/hospital/monitoring/session-template/upsert-ms-template-dialog"
import { getMsTemplates } from "@/lib/services/monitoring/fetch-ms-data"
import { BookmarkIcon } from "lucide-react"

export default async function MsTemplatePage(props : PageProps<'/hospital/[hos_id]/monitoring/[target_date]/template'>){

    const {hos_id} = await props.params
    const msTemplates = await getMsTemplates(hos_id)
    return (
        <div>
            <MobileTitle icon={BookmarkIcon} title="템플릿" />
            <MsTemplateEntry msTemplates={msTemplates} hosId={hos_id} />
            <UpsertMsTemplateDialog hosId={hos_id} isEdit={true} mstemplate={null} />
        </div>
    )
}