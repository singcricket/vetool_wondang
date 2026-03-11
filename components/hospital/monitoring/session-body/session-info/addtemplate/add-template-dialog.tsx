'use client'

import Autocomplete from '@/components/common/auto-complete/auto-complete'
import GroupBadge from '@/components/hospital/icu/main/chart/selected-chart/chart-body/chart-infos/group/group-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { updateMsTag } from '@/lib/services/monitoring/update-ms'
import { BookmarkIcon, ComponentIcon } from 'lucide-react'
// import { updateClTag } from '@/lib/services/checklist/update-checklist'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getMsTemplates, MsTemplateChart, MsWithPatientWithWeight } from '@/lib/services/monitoring/fetch-ms-data'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/ui/data-table'
import { te } from 'date-fns/locale'
import { pasteMsTemplateColumns } from './paste_ms-template-columns'

type Props = {
  msData:MsWithPatientWithWeight
}

export default function AddTemplateDialog({ msData }: Props) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [msTemplateCharts, setMsTemplateCharts] = useState<MsTemplateChart[]>([])
  const [isFetching, setIsFetching] = useState(false)
   
 useEffect(() => {
    const fetchMsTemplates = async () => {
      setIsFetching(true)

      const templates = await getMsTemplates(msData.hos_id)
      console.log('fetch ms templates', templates)
      setMsTemplateCharts(templates)

      setIsFetching(false)
    }
    isDialogOpen && fetchMsTemplates()
  }, [isDialogOpen])
   
  
      


  return (
     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button   size="default"
              variant="outline"
              className="flex w-full items-center justify-start gap-2 px-2">
             
               <BookmarkIcon  />
                <span className="text-muted-foreground">템플릿선택</span>
             
            </Button>
          </DialogTrigger>
    
          <DialogContent className="flex h-[609.5px] flex-col justify-start md:max-w-[1200px]">
            <DialogHeader>
              <DialogTitle>태플릿 세션 붙여넣기</DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <DataTable searchPlaceHolder='템플릿 이름 · 템플릿 설명 검색' data={msTemplateCharts} columns={pasteMsTemplateColumns({setIsDialogOpen,msData:msData })} rowLength={10}>

            </DataTable>
    
     
     <DialogFooter>
           
          </DialogFooter>
          </DialogContent>
         
        </Dialog>
    
  )
}
