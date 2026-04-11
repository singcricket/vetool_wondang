'use client'

import type { EchoChartDetail } from '@/types/echocardio/echocardio-type'
import EchoVets from './echo-vets'
import EchoMemo from './echo-memo'
import EchoTags from './echo-tags'

type Props = {
  chartDetail: EchoChartDetail
}

export default function EchoInfoContainer({ chartDetail }: Props) {
  const { id, vet, examiner, vet_id, examiner_id, memo, user_tags } = chartDetail

  return (
    <div className="flex w-full flex-col gap-2 border-b p-2">
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="flex-1">
          <EchoVets
            echoId={id}
            vetId={vet_id}
            examinerId={examiner_id}
            vetName={vet?.name ?? null}
            examinerName={examiner?.name ?? null}
          />
        </div>
        <div className="flex-1">
          <EchoTags
            echoId={id}
            userTags={user_tags}
            chartDetail={chartDetail}
          />
        </div>
      </div>
      <div className="mt-1">
        <EchoMemo echoId={id} memo={memo} />
      </div>
    </div>
  )
}
