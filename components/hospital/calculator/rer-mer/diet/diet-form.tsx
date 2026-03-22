import DietComboBox from '@/components/hospital/calculator/rer-mer/diet/diet-combo-box'
import CalculatorResult from '@/components/hospital/calculator/result/calculator-result'
import { DIETS } from '@/constants/hospital/icu/calculator/diet'
import { cacluateFeedAmount } from '@/lib/calculators/rer-mer'
import { useState } from 'react'
import UnitInput from '../../unit-input'

type Props = {
  mer?: number
  setIsSheetOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export default function DietForm({ mer, setIsSheetOpen }: Props) {
  const [selectedDietId, setSelectedDietId] = useState<number | undefined>()
  const [feedPerDay, setFeedPerDay] = useState('2')

  const selectedDiet = DIETS.find((diet) => diet.diet_id === selectedDietId)
  const massVol = selectedDiet?.mass_vol
  const unit = selectedDiet?.unit ?? 'g'

  const result = cacluateFeedAmount(mer, massVol, Number(feedPerDay))

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <DietComboBox
          diets={DIETS}
          selectedDietId={selectedDietId}
          setSelectedDietId={setSelectedDietId}
          disabled={!mer}
        />

        <UnitInput
          label="급여 횟수"
          id="feedPerDay"
          unit="회/일"
          value={feedPerDay}
          onChange={(e) => setFeedPerDay(e.target.value)}
          placeholder="1~24"
          disabled={!mer}
        />
      </div>

      <div className="mt-4">
        {result && selectedDiet && (
          <CalculatorResult
            displayResult={
              <>
                <span>{selectedDiet.name}</span>{' '}
                <span className="font-bold text-primary">
                  {result.toString()} {unit}/회
                </span>
              </>
            }
            copyResult={`${selectedDiet.name} ${result.toString()} ${unit}/회, ${feedPerDay} 회/일`}
            orderName={selectedDiet.name}
            orderComment={`${result.toString()} ${unit}/회, ${feedPerDay} 회/일`}
            hasInsertOrderButton
            orderType="feed"
            setIsSheetOpen={setIsSheetOpen}
          />
        )}
      </div>
    </>
  )
}
