import MobileTitle from "@/components/common/mobile-title"
import UltrasoundSearchEntry from "@/components/hospital/ultrasound/ultrasound-search/ultrasound-search-entry"
import { getUltrasoundCharts } from "@/lib/services/ultrasound/fetch-ultrasound"
import { SearchIcon } from "lucide-react"

export default async function UltrasoundSearchPage(props: {
  params: Promise<{ hos_id: string; target_date: string }>
}) {
    const { hos_id } = await props.params
    const ultrasoundCharts = await getUltrasoundCharts(hos_id)

    return (
        <div className="flex flex-col gap-4">
            <MobileTitle icon={SearchIcon} title="초음파 차트 검색" />
            <UltrasoundSearchEntry ultrasoundCharts={ultrasoundCharts as any} hosId={hos_id} />
        </div>
    )
}
