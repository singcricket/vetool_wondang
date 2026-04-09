import EchoInputField from '../../echo-sections/echo-input-field'

interface Props {
  allItems: any[]
  resultMap: Record<string, string>
  computedResults: Record<string, { result: string; comment: string }>
  mmodeRefs: Record<string, [number, number] | null>
  onChange: (keywordId: string, value: string) => void
}

export default function EchoInputFlatMode({
  allItems,
  resultMap,
  computedResults,
  mmodeRefs,
  onChange,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-32">
      <div className="flex flex-col gap-2">
        {allItems.map((item: any) => (
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
  )
}
