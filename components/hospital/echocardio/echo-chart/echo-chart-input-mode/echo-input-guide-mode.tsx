import Image from 'next/image'
import EchoInputField from '../../echo-sections/echo-input-field'
import { EchoTemplateGuideImage } from '@/types/echocardio/echocardio-type'

interface Props {
  guideImages: EchoTemplateGuideImage[]
  allActiveItems: any[]
  resultMap: Record<string, string>
  computedResults: Record<string, { result: string; comment: string }>
  mmodeRefs: Record<string, [number, number] | null>
  onChange: (keywordId: string, value: string) => void
}

export default function EchoInputGuideMode({
  guideImages,
  allActiveItems,
  resultMap,
  computedResults,
  mmodeRefs,
  onChange,
}: Props) {
  if (guideImages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <p className="mt-8 text-center text-xs text-muted-foreground">
          설정에서 가이드 이미지를 추가하세요
        </p>
      </div>
    )
  }

  const mappedKeywordIds = new Set(guideImages.flatMap((g) => g.mapped_keywords))
  const unmappedItems = allActiveItems.filter((item: any) => !mappedKeywordIds.has(item.keywordID))

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-32">
      <div className="flex flex-col gap-6">
        {guideImages.map((guide) => {
          const guideItems = allActiveItems.filter((item: any) =>
            guide.mapped_keywords.includes(item.keywordID),
          )
          return (
            <div key={guide.id} className="rounded-md border bg-white">
              <div className="border-b px-3 py-1.5">
                <span className="text-xs font-bold">{guide.view_name}</span>
              </div>
              <div className="flex gap-4 p-3">
                {/* 이미지 */}
                <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded border bg-muted">
                  <Image
                    src={guide.image_url}
                    alt={guide.view_name}
                    fill
                    className="object-contain"
                    sizes="160px"
                  />
                </div>
                {/* 연결 항목 입력 */}
                <div className="flex flex-1 flex-col gap-2">
                  {guideItems.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">연결된 항목 없음</p>
                  ) : (
                    guideItems.map((item: any) => (
                      <EchoInputField
                        key={item.keywordID}
                        item={item}
                        value={resultMap[item.keywordID] ?? ''}
                        computed={computedResults[item.keywordID]}
                        mmodeRef={mmodeRefs[item.keywordID] ?? undefined}
                        onChange={onChange}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* 가이드에 연결되지 않은 나머지 항목 */}
        {unmappedItems.length > 0 && (
          <div className="rounded-md border bg-white">
            <div className="border-b px-3 py-1.5">
              <span className="text-xs font-bold text-muted-foreground">기타 항목</span>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {unmappedItems.map((item: any) => (
                <EchoInputField
                  key={item.keywordID}
                  item={item}
                  value={resultMap[item.keywordID] ?? ''}
                  computed={computedResults[item.keywordID]}
                  mmodeRef={mmodeRefs[item.keywordID] ?? undefined}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
