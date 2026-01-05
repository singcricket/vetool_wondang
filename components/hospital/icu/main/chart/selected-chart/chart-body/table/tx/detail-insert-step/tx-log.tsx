import FormattedMonoDate from '@/components/common/formatted-mono-date'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import type { TxLog } from '@/types/icu/chart'

export default function TxLog({ logs }: { logs?: TxLog[] | null }) {
  return (
    <div>
      <div className="text-sm font-medium">처치 로그</div>
      <Accordion type="single" collapsible className="mt-2">
        <AccordionItem value="logs">
          <AccordionTrigger className="py-1">
            <div className="flex w-full items-center py-2">
              <div className="w-2/5 px-2 text-center">처치결과</div>
              <div className="w-1/5 px-2 text-center">처치자</div>
              <div className="w-2/5 pl-6 text-center">시간</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <Table>
              <TableBody>
                {logs &&
                  logs.map((log, index) => (
                    <TableRow
                      className="flex w-full items-center justify-between"
                      key={index}
                    >
                      <TableCell
                        className="w-2/5 px-2 text-center"
                        title={log.result ?? ''}
                      >
                        <div className="truncate">{log.result}</div>
                      </TableCell>
                      <TableCell className="w-1/5 px-2 text-center">
                        {log.name}
                      </TableCell>
                      <TableCell className="w-2/5 pr-8 text-right tracking-tighter">
                        <FormattedMonoDate
                          date={log.createdAt}
                          withTime
                          className="text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
