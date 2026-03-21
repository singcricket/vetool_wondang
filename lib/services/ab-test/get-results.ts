'use server'

import { createClient } from '@/lib/supabase/server'

export type AbTestStats = {
  results: {
    selected_option: string
    count: number
  }[]
  opinions: {
    selected_option: string
    other_opinion: string
  }[]
}

export const getAbTestNames = async (): Promise<string[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ab_test_results')
    .select('test_name')

  if (error) {
    console.error('Error fetching AB test names:', error)

    return []
  }

  const names = Array.from(
    new Set(data.map((item: any) => item.test_name)),
  ) as string[]

  return names
}

export const getAbTestResults = async (
  testName: string,
): Promise<AbTestStats> => {
  const supabase = await createClient()

  // @ts-ignore
  const { data, error } = await supabase
    .from('ab_test_results')
    .select('selected_option, other_opinion')
    .eq('test_name', testName)

  if (error) {
    console.error('Error fetching AB test results:', error)
    return { results: [], opinions: [] }
  }

  // Count locally
  const counts: Record<string, number> = {}
  const opinions: { selected_option: string; other_opinion: string }[] = []

  data.forEach((item: any) => {
    const option = item.selected_option
    counts[option] = (counts[option] || 0) + 1

    if (item.other_opinion) {
      opinions.push({
        selected_option: option,
        other_opinion: item.other_opinion,
      })
    }
  })

  // Convert to array
  const results = Object.entries(counts).map(([selected_option, count]) => ({
    selected_option,
    count,
  }))

  return { results, opinions }
}
