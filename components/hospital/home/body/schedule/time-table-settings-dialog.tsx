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

export default function TimeTableSettingsDialog({ hosId }: { hosId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<TimeTemplate[]>([])
  const [categories, setCategories] = useState<ScheduleCategory[]>([])
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
          setTemplates(setting.time_templates || [])
          setCategories(setting.schedule_categories || [])
        } catch (error) {
          console.error(error)
          toast.error('설정을 불러오는데 실패했습니다.')
        }
      }
      load()
    }
  }, [isOpen, hosId])

  const handleAddTemplate = () => {
    setTemplates([
      ...templates,
      {
        id: Math.random().toString(36).substring(7),
        name: '',
        start_time: '09:00',
        end_time: '18:00',
      },
    ])
  }

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newSetting: ScheduleSetting = {
        ...currentSetting!,
        additional_staffs: currentSetting?.additional_staffs || [],
        time_templates: templates.filter((t) => t.name.trim() !== ''),
        schedule_categories: categories.filter((c) => c.name.trim() !== ''),
      }
      await updateHospitalScheduleSetting(hosId, newSetting)
      toast.success('시간표 설정이 저장되었습니다.')
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>시간표(근무시간) 및 카테고리 설정</DialogTitle>
          <DialogDescription>
            근무 시간대와 일정 카테고릴 설정합니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="template" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">시간표 템플릿</TabsTrigger>
              <TabsTrigger value="category">일정 카테고리</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <TabsContent value="template" className="mt-0 space-y-4">
              <div className="grid grid-cols-[30px_1fr_1fr_1fr_45px_90px_90px_35px] gap-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase">
                <div></div>
                <div>템플릿명</div>
                <div>기본 제목</div>
                <div>기본 카테고리</div>
                <div className="text-center">종일</div>
                <div>시작</div>
                <div>종료</div>
                <div></div>
              </div>

              <ReactSortable
                list={templates as any[]}
                setList={setTemplates as any}
                animation={250}
                handle=".handle"
                className="space-y-2"
              >
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="grid grid-cols-[30px_1fr_1fr_1fr_45px_90px_90px_35px] gap-2 items-center bg-slate-50 p-1.5 rounded border"
                  >
                    <div className="handle cursor-move flex justify-center text-slate-400 hover:text-slate-600">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <Input
                      className="h-8 text-xs"
                      placeholder="템플릿 명칭"
                      value={template.name}
                      onChange={(e) =>
                        setTemplates(
                          templates.map((t) =>
                            t.id === template.id
                              ? { ...t, name: e.target.value }
                              : t,
                          ),
                        )
                      }
                    />
                    <Input
                      className="h-8 text-xs"
                      placeholder="기본 제목"
                      value={template.title || ''}
                      onChange={(e) =>
                        setTemplates(
                          templates.map((t) =>
                            t.id === template.id
                              ? { ...t, title: e.target.value }
                              : t,
                          ),
                        )
                      }
                    />
                    <Select
                      defaultValue={template.category || '일반'}
                      onValueChange={(val) =>
                        setTemplates(
                          templates.map((t) =>
                            t.id === template.id ? { ...t, category: val } : t,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="카테고리" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="일반" className="text-xs">
                          일반
                        </SelectItem>
                        {categories.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={c.name}
                            className="text-xs"
                          >
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-center">
                      <Switch
                        className="scale-75"
                        checked={template.is_all_day || false}
                        onCheckedChange={(checked) =>
                          setTemplates(
                            templates.map((t) =>
                              t.id === template.id
                                ? { ...t, is_all_day: checked }
                                : t,
                            ),
                          )
                        }
                      />
                    </div>
                    <Input
                      className="h-8 text-xs px-1 disabled:opacity-30"
                      type="time"
                      disabled={template.is_all_day}
                      value={template.start_time}
                      onChange={(e) =>
                        setTemplates(
                          templates.map((t) =>
                            t.id === template.id
                              ? { ...t, start_time: e.target.value }
                              : t,
                          ),
                        )
                      }
                    />
                    <Input
                      className="h-8 text-xs px-1 disabled:opacity-30"
                      type="time"
                      disabled={template.is_all_day}
                      value={template.end_time}
                      onChange={(e) =>
                        setTemplates(
                          templates.map((t) =>
                            t.id === template.id
                              ? { ...t, end_time: e.target.value }
                              : t,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setTemplates(
                          templates.filter((t) => t.id !== template.id),
                        )
                      }
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </ReactSortable>

              {templates.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-md">
                  등록된 시간표 템플릿이 없습니다.
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTemplate}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                템플릿 추가
              </Button>
            </TabsContent>

            <TabsContent value="category" className="mt-0 space-y-4">
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
          </div>
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
            {isSaving ? '저장 중...' : '전체 저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
