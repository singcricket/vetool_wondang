import MobileTitle from "@/components/common/mobile-title"
import NeuroSearchEntry from "@/components/hospital/neuro/neuro-search/neuro-search-entry"
import { getNeuroCharts } from "@/lib/services/neuro/fetch-neuro"
import { SearchIcon } from "lucide-react"

export default async function NeuroSearchPage(props: {
  params: Promise<{ hos_id: string; target_date: string }>
}) {
    const { hos_id } = await props.params
    const neuroCharts = await getNeuroCharts(hos_id)

    return (
        <div className="flex flex-col gap-4">
            <MobileTitle icon={SearchIcon} title="신경계 차트 검색" />
            <NeuroSearchEntry neuroCharts={neuroCharts as any} hosId={hos_id} />
        </div>
    )
}
