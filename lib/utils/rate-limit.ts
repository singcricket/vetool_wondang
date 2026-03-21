const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean } {
  const now = Date.now()
  const entry = requestCounts.get(key)

  if (!entry || now > entry.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true }
  }

  if (entry.count >= limit) {
    return { success: false }
  }

  entry.count += 1
  return { success: true }
}
