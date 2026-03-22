import HelperTooltip from '@/components/common/helper-tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function TransfusionTooltip() {
  return (
    <HelperTooltip>
      <Table className="mt-1">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-7 px-1 text-xs">항목</TableHead>
            <TableHead className="h-7 px-1 text-right text-xs">값</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1 text-xs">공식</TableCell>
            <TableCell className="p-1 text-right font-mono text-xs">
              BW × 혈액량 × ΔPCVt / PCVd
            </TableCell>
          </TableRow>

          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1 text-xs">개 혈액량</TableCell>
            <TableCell className="p-1 text-right text-xs">
              90 mL/kg (range 80–90)
            </TableCell>
          </TableRow>

          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1 text-xs">고양이 혈액량</TableCell>
            <TableCell className="p-1 text-right text-xs">
              60 mL/kg (range 60–70)
            </TableCell>
          </TableRow>

          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1 text-xs">초기 모니터링 속도</TableCell>
            <TableCell className="p-1 text-right text-xs">
              0.25–0.5 mL/kg/hr × 15~30분
            </TableCell>
          </TableRow>

          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1 text-xs">유지 속도</TableCell>
            <TableCell className="p-1 text-right text-xs">
              5–10 mL/kg/hr
            </TableCell>
          </TableRow>

          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1 text-xs">최대 속도 (응급)</TableCell>
            <TableCell className="p-1 text-right text-xs">
              20 mL/kg/hr
            </TableCell>
          </TableRow>

          <TableRow className="hover:bg-transparent">
            <TableCell className="p-1 text-xs">분할 투여 기준</TableCell>
            <TableCell className="p-1 text-right text-xs">
              {'>'} 20 mL/kg
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        <li>
          * Calculator에서는 단일 blood volume 값을 사용해야 하므로 Dog 90, Cat
          60 mL/kg을 사용함.
        </li>
        <li>
          * Dog는 under-transfusion 방지를 위해 상한값을, Cat은 volume
          overload(TACO) 위험을 고려하여 보수적인 값을 사용함.
        </li>
        <li>
          * 최근 수의학 가이드라인에서는 routine steroid 또는 antihistamine
          전처치를 권장하지 않음.
        </li>
        <li>
          * 이전 transfusion reaction 병력이 있는 경우 antihistamine 또는
          maropitant 사용을 고려할 수 있음.
        </li>
      </ul>

      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        <li>
          * Hohenhaus AE. Blood transfusion and blood substitutes. In: Ettinger
          SJ, Feldman EC, eds. <br />
          <em>Textbook of Veterinary Internal Medicine.</em> 7th ed. Saunders;
          2010:536–546.
        </li>
        <li>
          * Davidow EB. Transfusion medicine in small animals.{' '}
          <em>Vet Clin North Am Small Anim Pract.</em> 2013;43(4):735–756.
        </li>
        <li>
          * Silverstein DC, Hopper K, eds.{' '}
          <em>Small Animal Critical Care Medicine.</em> 2nd ed. Elsevier; 2015.
        </li>
        <li>
          * Yagi K, Holowaychuk MK, eds.{' '}
          <em>Manual of Veterinary Transfusion Medicine and Blood Banking.</em>{' '}
          Wiley-Blackwell; 2016.
        </li>
      </ul>
    </HelperTooltip>
  )
}
