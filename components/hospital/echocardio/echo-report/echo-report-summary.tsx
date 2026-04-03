interface EchoReportSummaryProps {
  memo: string | null
}

export default function EchoReportSummary({ memo }: EchoReportSummaryProps) {
  if (!memo) return null

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed p-4">
      <h3 className="text-sm font-bold text-primary italic">Summary & Recommendation</h3>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground print:text-[11px]">
        {memo}
      </p>
    </div>
  )
}
