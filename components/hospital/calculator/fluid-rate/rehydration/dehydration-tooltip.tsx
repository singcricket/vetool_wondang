import HelperTooltip from '@/components/common/helper-tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function DehydrationTooltip() {
  return (
    <HelperTooltip side="bottom">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estimated % Dehydration</TableHead>
            <TableHead>Physical Examination Finding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>&lt;5%</TableCell>
            <TableCell>
              <ul className="list-inside list-disc space-y-1">
                <li> Not detectable</li>
              </ul>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>5-6%</TableCell>
            <TableCell>
              <ul className="list-inside list-disc space-y-1">
                <li>Some change in skin turgor</li>
              </ul>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>6-8%</TableCell>
            <TableCell>
              <ul className="list-inside list-disc space-y-1">
                <li>Mild decreased skin turgor</li>
                <li>Dry mucous membranes</li>
              </ul>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>8-10%</TableCell>
            <TableCell>
              <ul className="list-inside list-disc space-y-1">
                <li>Obvious decreased skin turgor</li>
                <li>Retracted globes within orbits</li>
              </ul>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>10-12%</TableCell>
            <TableCell>
              <ul className="list-inside list-disc space-y-1">
                <li>
                  Persistent skin tent due to complete loss of skin elasticity
                </li>
                <li>Dull corneas</li>
                <li>Evidence of hypovolemia</li>
              </ul>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>&gt;12%</TableCell>
            <TableCell>
              <ul className="list-inside list-disc space-y-1">
                <li>Hypovolemic shock</li>
                <li>Death</li>
              </ul>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="mt-2 text-xs text-muted-foreground">
        *2024 AAHA Fluid Therapy Guidelines for Dogs and Cats
      </div>
    </HelperTooltip>
  )
}
