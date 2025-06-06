"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Calendar, CalendarDays, Share2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import EventSettings from "./EventSettings"
import type { ScheduleType } from "./constants"

type EventHeaderProps = {
  eventId: string
  eventType: "recurring" | "onetime"
  eventName: string
  eventDescription: string
  dateTimeOptions?: string[]
  xAxis?: string[]
  yAxis?: string[]
  scheduleTypes: ScheduleType[]
  onUpdate: () => void
}

export default function EventHeader({
  eventId,
  eventType,
  eventName,
  eventDescription,
  dateTimeOptions = [],
  xAxis = [],
  yAxis = [],
  scheduleTypes,
  onUpdate,
}: EventHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // イベントURLをコピー
  const copyEventUrl = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(
      () => {
        toast({
          title: "URLをコピーしました",
          description: "イベントのURLがクリップボードにコピーされました。",
        })
      },
      (err) => {
        console.error("URLのコピーに失敗しました:", err)
        toast({
          title: "コピーに失敗しました",
          description: "URLのコピーに失敗しました。もう一度お試しください。",
          variant: "destructive",
        })
      },
    )
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{eventName}</h1>
            {eventDescription && <p className="text-gray-600 mt-1">{eventDescription}</p>}
            <div className="flex items-center mt-2 text-sm text-gray-500">
              {eventType === "recurring" ? (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  定期イベント
                </div>
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  単発イベント
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyEventUrl}>
              <Share2 className="h-4 w-4 mr-1" />
              共有
            </Button>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  設定
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <EventSettings
                  eventId={eventId}
                  eventType={eventType}
                  eventName={eventName}
                  eventDescription={eventDescription}
                  dateTimeOptions={dateTimeOptions}
                  xAxis={xAxis}
                  yAxis={yAxis}
                  scheduleTypes={scheduleTypes}
                  onUpdate={() => {
                    setIsSettingsOpen(false)
                    onUpdate()
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
