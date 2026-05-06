'use client'

import { UltrasoundChartDetail } from '@/types/hospital/ultrasound-type'
import UltrasoundVets from './ultrasound-vets'
import UltrasoundTags from './ultrasound-tags'

type Props = {
  chartDetail: UltrasoundChartDetail
  vetList: { user_id: string; name: string }[]
}

export default function UltrasoundInfoContainer({ chartDetail, vetList }: Props) {
  const { id, vet, evaluator, vet_id, evaluator_id, tags } = chartDetail

  return (
    <div className="flex w-full flex-col gap-2 border-b p-2 bg-white">
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="flex-1">
          <UltrasoundVets
            chartId={id}
            vetId={vet_id}
            evaluatorId={evaluator_id}
            vetName={vet?.name ?? null}
            evaluatorName={evaluator?.name ?? null}
            vetList={vetList}
          />
        </div>
        <div className="flex-1">
          <UltrasoundTags
            chartId={id}
            tags={tags}
            chartDetail={chartDetail}
          />
        </div>
      </div>
    </div>
  )
}
