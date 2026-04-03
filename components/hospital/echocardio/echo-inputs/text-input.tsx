'use client'

interface TextInputProps {
  keywordId: string
  value: string
  onChange: (keywordId: string, value: string) => void
  placeholder?: string
}

export default function TextInput({
  keywordId,
  value,
  onChange,
  placeholder,
}: TextInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(keywordId, e.target.value)}
      placeholder={placeholder ?? '코멘트를 입력하세요'}
      rows={2}
      className="w-full resize-none rounded border px-2 py-1.5 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-black/5"
    />
  )
}
