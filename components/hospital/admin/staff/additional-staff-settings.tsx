'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AdditionalStaff, ScheduleSetting } from '@/types/hospital'
import { updateHospitalScheduleSetting } from '@/lib/services/admin/staff'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ReactSortable } from 'react-sortablejs'

interface Props {
  hosId: string
  initialScheduleSetting: ScheduleSetting | null
  groupList: string[]
}

export default function AdditionalStaffSettings({
  hosId,
  initialScheduleSetting,
  groupList,
}: Props) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [staffs, setStaffs] = useState<AdditionalStaff[]>([])

  useEffect(() => {
    if (initialScheduleSetting?.additional_staffs) {
      setStaffs(
        (initialScheduleSetting.additional_staffs as any[]).map((s) => ({
          ...s,
          id: s.id || Math.random().toString(36).substring(7),
        })),
      )
    }
  }, [initialScheduleSetting])

  const handleAddStaff = () => {
    setStaffs([
      ...staffs,
      {
        id: Math.random().toString(36).substring(7),
        name: '',
        position: '',
        group: groupList[0] || '',
      },
    ])
  }

  const handleRemoveStaff = (id: string) => {
    setStaffs(staffs.filter((s) => s.id !== id))
  }

  const handleChange = (
    id: string,
    field: keyof AdditionalStaff,
    value: string,
  ) => {
    setStaffs(
      staffs.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newSetting: ScheduleSetting = {
        additional_staffs: staffs.filter((s) => s.name.trim() !== ''),
      }
      await updateHospitalScheduleSetting(hosId, newSetting)
      toast.success('원내 추가 스태프 설정이 저장되었습니다.')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg font-bold">원내 추가 스태프 설정</CardTitle>
        <CardDescription>
          정식 승인된 인원 외에 스케줄 관리 등을 위해 별도로 관리하는 스태프를
          추가할 수 있습니다. (드래그앤 드랍으로 순서를 변경할 수 있습니다.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 overflow-x-auto">
          <div className="min-w-[1050px] space-y-4">
            <div className="grid grid-cols-[40px_100px_100px_100px_1fr_120px_130px_150px_auto] gap-4 px-2 text-[10px] font-semibold text-muted-foreground uppercase">
              <div></div>
              <div>직원이름</div>
              <div>직책</div>
              <div>그룹</div>
              <div>주소</div>
              <div>전화번호</div>
              <div>입사일</div>
              <div>메모</div>
              <div className="w-10"></div>
            </div>

            <ReactSortable
              list={staffs}
              setList={setStaffs}
              animation={250}
              handle=".handle"
              className="space-y-2"
            >
              {staffs.map((staff) => (
                <div
                  key={staff.id}
                  className="grid grid-cols-[40px_100px_100px_100px_1fr_120px_130px_150px_auto] gap-4 items-center bg-white p-1 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                >
                  <div className="handle flex justify-center cursor-move text-slate-400 hover:text-slate-600">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <Input
                    className="h-8 text-xs"
                    placeholder="이름"
                    value={staff.name}
                    onChange={(e) => handleChange(staff.id, 'name', e.target.value)}
                  />
                  <Input
                    className="h-8 text-xs"
                    placeholder="직책"
                    value={staff.position}
                    onChange={(e) => handleChange(staff.id, 'position', e.target.value)}
                  />
                  <Select
                    value={staff.group}
                    onValueChange={(value) =>
                      handleChange(staff.id, 'group', value)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="그룹" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupList.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 text-xs"
                    placeholder="주소"
                    value={staff.address || ''}
                    onChange={(e) =>
                      handleChange(staff.id, 'address', e.target.value)
                    }
                  />
                  <Input
                    className="h-8 text-xs"
                    placeholder="전화번호"
                    value={staff.phone || ''}
                    onChange={(e) => handleChange(staff.id, 'phone', e.target.value)}
                  />
                  <Input
                    className="h-8 text-xs px-1"
                    type="date"
                    value={staff.join_date || ''}
                    onChange={(e) =>
                      handleChange(staff.id, 'join_date', e.target.value)
                    }
                  />
                  <Input
                    className="h-8 text-xs"
                    placeholder="비고/메모"
                    value={staff.memo || ''}
                    onChange={(e) => handleChange(staff.id, 'memo', e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStaff(staff.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ReactSortable>
          </div>

          {staffs.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-md">
              추가된 스태프가 없습니다.
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddStaff}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              스태프 추가
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '저장 중...' : '최종 저장/수정'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
