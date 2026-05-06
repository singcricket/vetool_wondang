'use client'

import { useEffect, useState } from 'react'
import { fetchPatientDashboardData, PatientDashboardData } from '@/lib/services/patient/fetch-patient-dashboard'
import { Patient } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  History, 
  Hospital, 
  Activity, 
  Heart, 
  Stethoscope, 
  ChevronRight,
  Calendar,
  Timer
} from 'lucide-react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  patient: Patient
  hosId: string
}

export default function PatientDashboardDetail({ patient, hosId }: Props) {
  const [data, setData] = useState<PatientDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const dashboardData = await fetchPatientDashboardData(patient.patient_id)
        setData(dashboardData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [patient.patient_id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!data) return null

  const activeIcu = data.icu.find(i => !i.out_date)

  return (
    <div className="mt-8 space-y-6 pb-10">
      <div className="flex items-center gap-2 border-b pb-2">
        <History className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-bold">{patient.name} 환자 대시보드</h2>
      </div>

      {/* 입원 정보 (ICU) */}
      <Card className="border-rose-100 bg-rose-50/30">
        <CardHeader className="py-4">
          <CardTitle className="text-lg flex items-center gap-2 text-rose-700">
            <Hospital className="h-5 w-5" />
            입원(ICU) 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.icu.length > 0 ? (
            <div className="space-y-4">
              {activeIcu && (
                <div className="flex items-center justify-between p-3 bg-white border border-rose-200 rounded-lg shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">현재 입원 중</Badge>
                      <span className="font-semibold text-rose-900">{activeIcu.diagnosis || '진단명 없음'}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-rose-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        입원일: {format(new Date(activeIcu.in_date), 'yyyy-MM-dd')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        기간: {differenceInDays(new Date(), new Date(activeIcu.in_date)) + 1}일째
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="default" className="bg-rose-600 hover:bg-rose-700">
                    <Link href={`/hospital/${hosId}/icu/${activeIcu.in_date}/chart/${activeIcu.icu_io_id}`}>차트로 바로가기</Link>
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.icu.filter(i => i.out_date).slice(0, 4).map((record) => (
                  <div key={record.icu_io_id} className="text-sm p-2 border rounded bg-white flex justify-between items-center">
                    <div>
                      <span className="font-medium">{record.in_date} ~ {record.out_date}</span>
                      <p className="text-muted-foreground text-xs truncate max-w-[150px]">{record.diagnosis}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/hospital/${hosId}/icu/${record.in_date}/chart/${record.icu_io_id}`}>보기</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">입원 기록이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* 차트 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 모니터링 */}
        <ChartListCard 
          title="모니터링" 
          icon={<Activity className="h-5 w-5 text-amber-600" />} 
          data={data.monitoring.map(m => ({ 
            id: m.session_id, 
            date: m.due_date, 
            label: m.session_title,
            href: `/hospital/${hosId}/monitoring/${m.due_date}/monitoring-session/${m.session_id}/session`
          }))}
        />

        {/* 심장초음파 */}
        <ChartListCard 
          title="심장초음파" 
          icon={<Heart className="h-5 w-5 text-red-600" />} 
          data={data.echo.map(e => ({ 
            id: e.id, 
            date: e.exam_date, 
            href: `/hospital/${hosId}/echocardio/${e.exam_date}/${e.id}`
          }))}
        />

        {/* 복부초음파 */}
        <ChartListCard 
          title="복부초음파" 
          icon={<Stethoscope className="h-5 w-5 text-emerald-600" />} 
          data={data.ultrasound.map(u => ({ 
            id: u.id, 
            date: u.chart_date, 
            href: `/hospital/${hosId}/ultrasound/${u.chart_date}/${u.id}`
          }))}
        />

        {/* 치과 */}
        <ChartListCard 
          title="치과" 
          icon={<span className="font-bold text-blue-600">D</span>} 
          data={data.dental.map(d => ({ 
            id: d.id, 
            date: d.chart_date, 
            href: `/hospital/${hosId}/dental/${d.chart_date}/${d.id}`
          }))}
        />
      </div>
    </div>
  )
}

function ChartListCard({ title, icon, data }: { title: string, icon: React.ReactNode, data: any[] }) {
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-1">
            {data.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0 group">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">{item.date}</span>
                  {item.label && <span className="text-sm font-medium truncate max-w-[120px]">{item.label}</span>}
                </div>
                <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={item.href} className="flex items-center gap-1">
                    바로가기 <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs py-4 text-center">기록이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  )
}
