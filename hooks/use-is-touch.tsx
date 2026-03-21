'use client'

import { useEffect, useState } from 'react'

export default function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkIsTouch = () => {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches)
    }

    checkIsTouch()

    // Technically pointer:coarse doesn't change with resize, 
    // but it's good to have for consistency if needed.
  }, [])

  return isTouch
}
