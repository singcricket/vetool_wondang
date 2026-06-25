export interface BlogImageCaption {
  isMark: boolean
  markJson: string | null
  description: string | null
  grayscale: boolean
}

export function parseBlogImageCaption(caption: string | null | undefined): BlogImageCaption {
  if (!caption) return { isMark: false, markJson: null, description: null, grayscale: false }
  try {
    const parsed = JSON.parse(caption)
    if (typeof parsed === 'object' && parsed !== null && 'objects' in parsed) {
      return {
        isMark: true,
        markJson: caption,
        description: typeof parsed.description === 'string' ? parsed.description || null : null,
        grayscale: !!parsed.grayscale,
      }
    }
  } catch { /* fall through */ }
  return { isMark: false, markJson: null, description: caption, grayscale: false }
}
