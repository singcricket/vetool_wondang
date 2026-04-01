export default function EchoReportFooter() {
  return (
    <div className="mt-auto hidden pt-8 text-center text-[10px] text-muted-foreground print:block">
      <p>© {new Date().getFullYear()} Hospital Veterinary Information System - Echocardiography Report</p>
    </div>
  )
}
