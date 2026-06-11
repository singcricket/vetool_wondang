'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getCheckupImages,
  type CheckupImage,
} from '@/lib/actions/checkup/checkup-image-actions'

export function useCheckupImages(checkupId: string) {
  const [images, setImages] = useState<CheckupImage[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const data = await getCheckupImages(checkupId)
      setImages(data)
    } finally {
      setLoading(false)
    }
  }, [checkupId])

  useEffect(() => {
    reload()
  }, [reload])

  const getByTags = useCallback(
    (tags: string[]) =>
      images.filter((img) => tags.some((t) => img.tags.includes(t))),
    [images],
  )

  return { images, loading, reload, getByTags }
}
