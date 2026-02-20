import SpeciesToIcon from '@/components/common/species-to-icon'
import { Species } from '@/constants/hospital/register/signalments'
import { calculateAge, cn, convertPascalCased } from '@/lib/utils/utils'
import type { SelectedIcuChart } from '@/types/icu/chart'
import { format } from 'date-fns'

type Props = {
  species: SelectedIcuChart['patient']['species']
  name: SelectedIcuChart['patient']['name']
  breed: SelectedIcuChart['patient']['breed']
  gender: SelectedIcuChart['patient']['gender']
  birth: SelectedIcuChart['patient']['birth']
  weight: SelectedIcuChart['weight']
  weightMeasuredDate: SelectedIcuChart['weight_measured_date']
  isAlive: SelectedIcuChart['patient']['is_alive']
  className?: string
  hosPatientId?: string
}

export default function PatientDetailInfo({
  species,
  name,
  breed,
  gender,
  birth,
  weight,
  weightMeasuredDate,
  isAlive = true,
  className,
  hosPatientId,
}: Props) {
  return (
    <div className={cn('flex items-center gap-1 sm:gap-2', className)}>
      <SpeciesToIcon species={species as Species} />
        <div className="flex items-center gap-1.5">
        {isAlive ? null : <span className="ml-1">🌈</span>}
        <span>{name}</span>
         <span className="text-sm">{hosPatientId}</span>
        
      </div>
      ·
      <span className="w-12 truncate sm:w-auto">
        {convertPascalCased(breed)}
      </span>
      ·<span className="uppercase">{gender}</span>·
      <span>{calculateAge(birth)} </span>
      <span>·</span>
      <span>
        {weight === '' ? '체중 미측정' : `${weight}kg`}

        {weightMeasuredDate && (
          <span className="hidden font-mono text-sm md:inline">
            {`(${format(weightMeasuredDate, 'yy.MM.dd')})`}
          </span>
        )}
      </span>
    </div>
  )
}
