import MobileTitle from "@/components/common/mobile-title"
import EchoSearchEntry from "@/components/hospital/echocardio/echo-search/echo-search-entry"
import { getEchoCharts } from "@/lib/services/echocardio/fetch-echo"
import { SearchIcon } from "lucide-react"

export default async function EchoSearchPage(props: PageProps<'/hospital/[hos_id]/echocardio/[target_date]/search'>) {
    const { hos_id } = await props.params
    const echoCharts = await getEchoCharts(hos_id)

    return (
        <div>
            <MobileTitle icon={SearchIcon} title="심초음파 차트 검색" />
            <EchoSearchEntry echoCharts={echoCharts} hosId={hos_id} />
        </div>
    )
}
