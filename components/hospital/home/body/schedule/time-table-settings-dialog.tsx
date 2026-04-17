'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Settings, GripVertical, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ScheduleSetting,
  ScheduleCategory,
  TimeTemplate,
} from '@/types/hospital'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchScheduleSetting } from '@/lib/services/hospital-home/todo'
import { updateHospitalScheduleSetting } from '@/lib/services/admin/staff'
import { toast } from 'sonner'
import { ReactSortable } from 'react-sortablejs'

export default function TimeTableSettingsDialog({ hosId, isAdmin }: { hosId: string; isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<ScheduleCategory[]>([])
  const [hiddenCategories, setHiddenCategories] = useState<ScheduleCategory[]>([])
  const [currentSetting, setCurrentSetting] = useState<ScheduleSetting | null>(
    null,
  )

  const DEFAULT_COLORS = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#64748b',
  ]

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        try {
          const setting = await fetchScheduleSetting(hosId)
          setCurrentSetting(setting)
          setCategories(setting.schedule_categories || [])
          setHiddenCategories(setting.hidden_categories || [])
        } catch (error) {
          console.error(error)
          toast.error('설정을 불러오는데 실패했습니다.')
        }
      }
      load()
    }
  }, [isOpen, hosId])

  const handleAddCategory = () => {
    setCategories([
      ...categories,
      {
        id: Math.random().toString(36).substring(7),
        name: '',
        color: DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length],
      },
    ])
  }

  const handleAddHiddenCategory = () => {
    setHiddenCategories([
      ...hiddenCategories,
      {
        id: Math.random().toString(36).substring(7),
        name: '',
        color: DEFAULT_COLORS[hiddenCategories.length % DEFAULT_COLORS.length],
      },
    ])
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newSetting: ScheduleSetting = {
        ...currentSetting!,
        schedule_categories: categories.filter((c) => c.name.trim() !== ''),
        hidden_categories: hiddenCategories.filter((c) => c.name.trim() !== ''),
      }
      await updateHospitalScheduleSetting(hosId, newSetting)
      toast.success('카테고리 설정이 저장되었습니다.')
      setIsOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>일정 카테고리 설정</DialogTitle>
          <DialogDescription>
            병원 일정에 사용될 카테고리와 색상을 설정합니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="standard" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="h-12 w-full justify-start bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="standard"
                className="h-12 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0"
              >
                일반 카테고리
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="hidden"
                  className="h-12 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0"
                >
                  히든 카테고리 (관리전용)
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="standard" className="flex-1 overflow-y-auto px-6 py-6 min-h-0 m-0 space-y-4">
            <div className="grid grid-cols-[30px_1fr_120px_40px] gap-4 px-2 text-xs font-semibold text-muted-foreground uppercase">
              <div></div>
              <div>카테고리 이름</div>
              <div>표시 색상</div>
              <div></div>
            </div>

            <ReactSortable
              list={categories as any[]}
              setList={setCategories as any}
              animation={250}
              handle=".handle"
              className="space-y-2"
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="grid grid-cols-[30px_1fr_120px_40px] gap-4 items-center bg-slate-50 p-2 rounded border"
                >
                  <div className="handle cursor-move flex justify-center text-slate-400 hover:text-slate-600">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <Input
                    className="h-9"
                    placeholder="예: 수술, 진료, 세미나"
                    value={category.name}
                    onChange={(e) =>
                      setCategories(
                        categories.map((c) =>
                          c.id === category.id
                            ? { ...c, name: e.target.value }
                            : c,
                        ),
                      )
                    }
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <Input
                      type="color"
                      className="h-9 p-1 w-full"
                      value={category.color}
                      onChange={(e) =>
                        setCategories(
                          categories.map((c) =>
                            c.id === category.id
                              ? { ...c, color: e.target.value }
                              : c,
                          ),
                        )
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCategories(categories.filter((c) => c.id !== category.id))
                    }
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ReactSortable>

            {categories.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-md">
                등록된 일정 카테고리가 없습니다.
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCategory}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              카테고리 추가
            </Button>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="hidden" className="flex-1 overflow-y-auto px-6 py-6 min-h-0 m-0 space-y-4">
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-md mb-4">
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  히든 카테고리는 관리자 권한을 가진 사용자에게만 노출되는 카테고리입니다. 
                  주요 내부 기록이나 민감한 업무를 분류할 때 사용하세요.
                </p>
              </div>

              <div className="grid grid-cols-[30px_1fr_120px_40px] gap-4 px-2 text-xs font-semibold text-muted-foreground uppercase">
                <div></div>
                <div>히든 카테고리 이름</div>
                <div>표시 색상</div>
                <div></div>
              </div>

              <ReactSortable
                list={hiddenCategories as any[]}
                setList={setHiddenCategories as any}
                animation={250}
                handle=".handle"
                className="space-y-2"
              >
                {hiddenCategories.map((category) => (
                  <div
                    key={category.id}
                    className="grid grid-cols-[30px_1fr_120px_40px] gap-4 items-center bg-slate-50 p-2 rounded border"
                  >
                    <div className="handle cursor-move flex justify-center text-slate-400 hover:text-slate-600">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <Input
                      className="h-9"
                      placeholder="예: 내부회의, 보완사항"
                      value={category.name}
                      onChange={(e) =>
                        setHiddenCategories(
                          hiddenCategories.map((c) =>
                            c.id === category.id
                              ? { ...c, name: e.target.value }
                              : c,
                          ),
                        )
                      }
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <Input
                        type="color"
                        className="h-9 p-1 w-full"
                        value={category.color}
                        onChange={(e) =>
                          setHiddenCategories(
                            hiddenCategories.map((c) =>
                              c.id === category.id
                                ? { ...c, color: e.target.value }
                                : c,
                            ),
                          )
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setHiddenCategories(hiddenCategories.filter((c) => c.id !== category.id))
                      }
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </ReactSortable>

              {hiddenCategories.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-md">
                  등록된 히든 카테고리가 없습니다.
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddHiddenCategory}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                히든 카테고리 추가
              </Button>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-slate-50/50">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              취소
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
