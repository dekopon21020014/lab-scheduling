"use client"

import { type Dispatch, type SetStateAction, useEffect, useState, useRef } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MousePointer, Smartphone, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { gradeOptions, type ScheduleType } from "@/app/events/[eventId]/components/constants"
import type { Schedule, Participant } from "./types"
import { createEmptySchedule } from "./utils"
import { useMediaQuery } from "@/hooks/use-mobile"
import ScheduleTable from "./ScheduleTable"
import ScheduleCellMobile from "./ScheduleCellMobile"
import { useParams } from "next/navigation"

type Props = {
  xAxis: string[]
  yAxis: string[]
  scheduleTypes: ScheduleType[]
  currentName: string
  setCurrentName: Dispatch<SetStateAction<string>>
  currentGrade: string
  setCurrentGrade: Dispatch<SetStateAction<string>>
  currentSchedule: Schedule
  setCurrentSchedule: Dispatch<SetStateAction<Schedule>>
  participants: Participant[]
  setParticipants: Dispatch<SetStateAction<Participant[]>>
  editingIndex: number | null
  setEditingIndex: Dispatch<SetStateAction<number | null>>
  setActiveTab: (tab: string) => void
}

export default function ScheduleForm({
  xAxis,
  yAxis,
  scheduleTypes,
  currentName,
  setCurrentName,
  currentGrade,
  setCurrentGrade,
  currentSchedule,
  setCurrentSchedule,
  participants,
  setParticipants,
  editingIndex,
  setEditingIndex,
  setActiveTab,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [selectedCells, setSelectedCells] = useState<{ [key: string]: boolean }>({})
  const [bulkScheduleType, setBulkScheduleType] = useState<string>("")
  const [selectionMode, setSelectionMode] = useState<"tap" | "drag">(isMobile ? "tap" : "drag")
  const { eventId } = useParams()

  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectionMode(isMobile ? "tap" : "drag")
  }, [isMobile])

  useEffect(() => {
    if (editingIndex !== null) {
      const p = participants[editingIndex]
      setCurrentName(p.name)
      setCurrentGrade(p.grade || "")
      setCurrentSchedule({ ...p.schedule })
    } else {
      setCurrentSchedule(createEmptySchedule(xAxis, yAxis))
    }
  }, [editingIndex, participants, xAxis, yAxis])

  useEffect(() => {
    setBulkScheduleType(scheduleTypes[0]?.id || "")
  },[scheduleTypes])

  const updateSchedule = (labelX: string, labelY: string, value: string) => {
    const key = `${labelX}-${labelY}`
    setCurrentSchedule((prev) => ({ ...prev, [key]: value }))
  }

  // 選択タイプが変更されたときの処理
  const handleBulkTypeChange = (value: string) => {
    setBulkScheduleType(value)

    // 既に選択されているセルがある場合は即時適用
    if (Object.keys(selectedCells).length > 0) {
      const updated = { ...currentSchedule }
      for (const key of Object.keys(selectedCells)) {
        updated[key] = value
      }
      setCurrentSchedule(updated)
    }
  }

  const submit = async () => {
    if (!currentName.trim()) {
      toast({ title: "エラー", description: "名前を入力してください", variant: "destructive" })
      return
    }
    if (!currentGrade) {
      toast({ title: "エラー", description: "学年を選択してください", variant: "destructive" })
      return
    }

    const filled = Object.values(currentSchedule).filter(Boolean).length
    if (filled < 5 && !confirm("入力が少ないようです。本当に登録しますか？")) return

    const payload = {
      eventId,
      name: currentName,
      grade: currentGrade,
      schedule: currentSchedule,
    }

    try {
      if (editingIndex !== null) {
        const id = participants[editingIndex].id
        const res = await fetch(`/api/events/${eventId}/participants/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const updated = [...participants]
        updated[editingIndex] = { id, ...payload }
        setParticipants(updated)
        setEditingIndex(null)
      } else {
        const res = await fetch(`/api/events/${eventId}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const { id } = await res.json()
        setParticipants([...participants, { id, ...payload }])
      }

      toast({ title: "完了", description: "スケジュールを登録しました" })
      setCurrentName("")
      setCurrentGrade("")
      setCurrentSchedule(createEmptySchedule(xAxis, yAxis))
      setSelectedCells({})
      setBulkScheduleType("")
      setActiveTab("summary")
    } catch {
      toast({ title: "エラー", description: "保存に失敗しました", variant: "destructive" })
    }
  }

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => (prev === "tap" ? "drag" : "tap"))
    setSelectedCells({})
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>スケジュール入力</CardTitle>

        <CardDescription>
          {editingIndex !== null ? "スケジュールを編集してください" : "名前と予定を入力してください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 名前・学年入力 */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">名前</Label>
            <Input id="name" value={currentName} onChange={(e) => setCurrentName(e.target.value)} placeholder="名前" />
          </div>
          <div>
            <Label htmlFor="grade-select">学年</Label>
            <Select value={currentGrade} onValueChange={setCurrentGrade}>
              <SelectTrigger id="grade-select" className="w-full">
                <SelectValue placeholder="学年を選択" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 一括入力 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSelectionMode}
              className="text-xs flex items-center gap-1"
            >
              {selectionMode === "tap" ? <Smartphone className="w-3 h-3" /> : <MousePointer className="w-3 h-3" />}
              {selectionMode === "tap" ? "タップ" : "ドラッグ"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {scheduleTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleBulkTypeChange(type.id)}
                className={`
                  px-3 py-1.5 rounded-md text-sm transition-all
                  ${type.color}
                  ${bulkScheduleType === type.id ? "ring-2 ring-offset-1 ring-gray-900" : "hover:opacity-80"}
                `}
              >
                {type.label}
                {bulkScheduleType === type.id && <Check className="inline-block ml-1 h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* グリッド or モバイルビュー */}
        {isMobile ? (
          <div className="mb-3">
          {/* ─── X軸ヘッダー ─── */}
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `min-content repeat(${xAxis.length}, minmax(0, 1fr))` }}
          >
            {/* 左上のダミーセル */}
            <div></div>
            {xAxis.map((labelX) => (
              <div key={labelX} className="text-center font-medium text-sm">
                {labelX}
              </div>
            ))}
          </div>
        
          {/* ─── Y軸＋セル ─── */}
          <div
            className="grid gap-1 mt-1"
            style={{ gridTemplateColumns: `min-content repeat(${xAxis.length}, minmax(0, 1fr))` }}
          >
            {yAxis.map((labelY) => (
              <React.Fragment key={labelY}>
                {/* Y軸ラベル */}
                <div className="font-medium text-sm">{labelY}</div>
                {/* 各セル */}
                {xAxis.map((labelX) => (
                  <ScheduleCellMobile
                    key={`${labelX}-${labelY}`}
                    day={labelX}
                    period={labelY}
                    value={currentSchedule[`${labelX}-${labelY}`]}
                    selected={!!selectedCells[`${labelX}-${labelY}`]}
                    onTap={() => {
                      if (bulkScheduleType) {
                        updateSchedule(labelX, labelY, bulkScheduleType)
                      }
                    }}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        ) : (
          <div ref={tableRef}>
            <ScheduleTable
              xAxis={xAxis}
              yAxis={yAxis}
              scheduleTypes={scheduleTypes}
              schedule={currentSchedule}
              updateSchedule={updateSchedule}
              selectionMode={selectionMode}
              bulkScheduleType={bulkScheduleType}
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={submit} className="w-full md:w-auto">
          {editingIndex !== null ? "更新する" : "登録する"}
        </Button>
      </CardFooter>
    </Card>
  )
}
