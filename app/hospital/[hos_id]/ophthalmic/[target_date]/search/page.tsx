import MobileTitle from "@/components/common/mobile-title"
import OphthalmicSearchEntry from "@/components/hospital/ophthalmic/ophthalmic-search/ophthalmic-search-entry"
import { getOphthalmicCharts } from "@/lib/services/ophthalmic/fetch-ophthalmic"
import { SearchIcon } from "lucide-react"

export default async function OphthalmicSearchPage(props: {
  params: Promise<{ hos_id: string; target_date: string }>
}) {
    const { hos_id } = await props.params
    const ophthalmicCharts = await getOphthalmicCharts(hos_id)

    return (
        <div className="flex flex-col gap-4">
            <MobileTitle icon={SearchIcon} title="안과 차트 검색" />
            <OphthalmicSearchEntry ophthalmicCharts={ophthalmicCharts as any} hosId={hos_id} />
        </div>
    )
}
