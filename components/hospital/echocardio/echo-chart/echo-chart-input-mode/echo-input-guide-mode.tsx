import Image from 'next/image'
import EchoInputField from '../../echo-sections/echo-input-field'
import { EchoTemplateGuideImage } from '@/types/echocardio/echocardio-type'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SearchIcon } from 'lucide-react'

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
            <div key={guide.id} className="rounded-md border bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b px-3 py-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{guide.view_name}</span>
                <span className="text-[10px] text-muted-foreground italic">이미지 클릭 시 확대</span>
              </div>
              <div className="flex flex-col md:flex-row gap-4 p-4">
                {/* 이미지 (다이얼로그 확대 기능 추가) */}
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="group relative aspect-video w-full md:h-60 md:w-80 shrink-0 cursor-zoom-in overflow-hidden rounded border bg-muted shadow-sm ring-offset-background transition-all hover:ring-2 hover:ring-blue-500/50">
                      {guide.image_url ? (
                        <>
                          <Image
                            src={guide.image_url}
                            alt={guide.view_name}
                            fill
                            className="object-contain transition-transform group-hover:scale-105"
                            sizes="320px"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                            <SearchIcon className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200/50">
                          <span className="text-sm font-bold text-slate-400">{guide.view_name}</span>
                        </div>
                      )}
                    </div>
                  </DialogTrigger>
                  <DialogContent className={guide.image_url ? "max-w-4xl border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]" : "max-w-md"}>
                    <DialogHeader className={guide.image_url ? "hidden" : ""}>
                      <DialogTitle>{guide.view_name}</DialogTitle>
                    </DialogHeader>
                    {guide.image_url ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/90 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={guide.image_url}
                          alt={guide.view_name}
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                          {guide.view_name}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        이 항목은 가이드 이미지가 등록되어 있지 않습니다.
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
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
        {/* {unmappedItems.length > 0 && (
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
        )} */}
      </div>
    </div>
  )
}
