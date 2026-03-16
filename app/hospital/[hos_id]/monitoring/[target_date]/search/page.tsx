import MobileTitle from "@/components/common/mobile-title"
import MsSearchEntry from "@/components/hospital/monitoring/session-search/ms-search-entry"
import UpsertMsTemplateDialog from "@/components/hospital/monitoring/session-template/upsert-ms-template-dialog"
import { getMonitoringSessions, MonitoringSessionChart } from "@/lib/services/monitoring/fetch-ms-data"
import { BookmarkIcon } from "lucide-react"

export default async function MsTemplatePage(props : PageProps<'/hospital/[hos_id]/monitoring/[target_date]/template'>){

    const {hos_id} = await props.params
    const monitoringSessions : MonitoringSessionChart[] = await getMonitoringSessions(hos_id)
    console.log(monitoringSessions)
    return (
        <div>
            <MobileTitle icon={BookmarkIcon} title="모니터링 세션 검색" />
            <MsSearchEntry monitoringSessions={monitoringSessions} hosId={hos_id} />
            {/* <UpsertMsTemplateDialog hosId={hos_id} isEdit={true} mstemplate={null} /> */}
        </div>
    )
}