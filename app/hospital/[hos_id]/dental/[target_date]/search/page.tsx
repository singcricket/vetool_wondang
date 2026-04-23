import MobileTitle from "@/components/common/mobile-title"
import DentalSearchEntry from "@/components/hospital/dental/dental-search/dental-search-entry"
import { getDentalCharts } from "@/lib/services/dental/fetch-dental"
import { SearchIcon } from "lucide-react"

export default async function DentalSearchPage(props: PageProps<'/hospital/[hos_id]/dental/[target_date]/search'>) {
    const { hos_id } = await props.params
    const dentalCharts = await getDentalCharts(hos_id)

    return (
        <div className="flex flex-col gap-4">
            <MobileTitle icon={SearchIcon} title="치과 차트 검색" />
            <DentalSearchEntry dentalCharts={dentalCharts} hosId={hos_id} />
        </div>
    )
}
