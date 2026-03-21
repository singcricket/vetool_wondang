'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAbTestNames,
  getAbTestResults,
} from '@/lib/services/ab-test/get-results'
import { useEffect, useState } from 'react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

type LocalResult = {
  name: string
  value: number
  fill: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AbTestResults() {
  const [data, setData] = useState<LocalResult[]>([])
  const [opinions, setOpinions] = useState<
    { selected_option: string; other_opinion: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [testNames, setTestNames] = useState<string[]>([])
  const [selectedTest, setSelectedTest] = useState<string>('')

  // First fetch available test names
  useEffect(() => {
    const fetchNames = async () => {
      try {
        const names = await getAbTestNames()
        setTestNames(names)
        if (names.length > 0) {
          setSelectedTest(names[0])
        }
      } catch (error) {
        console.error('Failed to fetch test names', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNames()
  }, [])

  // When selected test changes, fetch its results
  useEffect(() => {
    if (!selectedTest) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const { results, opinions } = await getAbTestResults(selectedTest)

        // Transform for chart
        const chartData = results.map((r, index) => ({
          name: r.selected_option,
          value: r.count,
          fill: COLORS[index % COLORS.length],
        }))

        setData(chartData)
        setOpinions(opinions)
        setTotal(results.reduce((acc, curr) => acc + curr.count, 0))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedTest])

  if (loading && testNames.length === 0) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (testNames.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        No A/B tests found yet.
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Select Test:</span>
        <Select
          value={selectedTest}
          onValueChange={(val) => setSelectedTest(val)}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a test" />
          </SelectTrigger>
          <SelectContent>
            {testNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTest && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Chart Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>AB Test Count: {selectedTest}</CardTitle>
              <CardDescription>Total Responses: {total}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-[400px] items-center justify-center">
                  <Skeleton className="h-[300px] w-[300px] rounded-full" />
                </div>
              ) : total === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No data available for this test.
                </div>
              ) : (
                <>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4 text-center">
                    {data.map((item) => (
                      <div
                        key={item.name}
                        className="flex flex-col rounded-lg border p-4"
                      >
                        <span className="text-xl font-bold">{item.name}</span>
                        <span className="text-3xl font-extrabold text-primary">
                          {item.value}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {total > 0
                            ? ((item.value / total) * 100).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Opinions Section */}
          <Card className="h-full w-full">
            <CardHeader>
              <CardTitle>Opinions & Feedback</CardTitle>
              <CardDescription>
                Detailed feedback from users (Option C)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opinions.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No written opinions yet.
                </div>
              ) : (
                <div className="flex max-h-[600px] flex-col gap-3 overflow-y-auto pr-2">
                  {opinions.map((op, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 rounded-md border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                            op.selected_option === 'A'
                              ? 'bg-[#0088FE]'
                              : op.selected_option === 'B'
                                ? 'bg-[#00C49F]'
                                : op.selected_option === 'C'
                                  ? 'bg-[#FFBB28]'
                                  : 'bg-gray-500'
                          }`}
                        >
                          {op.selected_option}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          Option {op.selected_option}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">
                        {op.other_opinion}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
