import HelperTooltip from '@/components/common/helper-tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ChocolateToolTip() {
  return (
    <HelperTooltip side="bottom">
      <Table className="mt-1 w-[320px] text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-7 px-1">독성 수치</TableHead>
            <TableHead className="h-7 px-1 text-right">예상 증상</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1">{'< 20 mg/kg'}</TableCell>
            <TableCell className="p-1 text-right">위장 증상 미미</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1">20–40 mg/kg</TableCell>
            <TableCell className="p-1 text-right">소화기 증상</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1">40–60 mg/kg</TableCell>
            <TableCell className="p-1 text-right">심혈관계 증상</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1">60–100 mg/kg</TableCell>
            <TableCell className="p-1 text-right">신경계 증상</TableCell>
          </TableRow>
          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1">{'> 100 mg/kg'}</TableCell>
            <TableCell className="p-1 text-right">치명적 (LD₅₀ 근접)</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <ul className="mt-2 w-[320px] space-y-1 text-xs text-muted-foreground">
        <li>
          * Gwaltney-Brant SM. Chocolate intoxication. <em>Vet Med.</em>{' '}
          2001;96(2):108–111.
        </li>
        <li>
          * Merck Veterinary Manual — Chocolate Poisoning (Theobromine
          Toxicosis), 2023.
        </li>
        <li>
          * Peterson ME, Talcott PA. <em>Small Animal Toxicology.</em> 3rd ed.
          Elsevier; 2013. Chapter: Methylxanthines.
        </li>
        <li>
          * ASPCA Animal Poison Control Center — Chocolate Toxicity Thresholds &
          Theobromine Content Reference.
        </li>
      </ul>
    </HelperTooltip>
  )
}
