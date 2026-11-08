"use client"

import Link from "next/link"
import { CalendarClock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { EventRecord } from "@/lib/user-data"

export function Reminders() {
  const { items: events, loading, error } = useUserCollection<EventRecord>("events")
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events
    .filter((event) => event.date >= today)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 3)

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Pengingat</h2>
        <Link href="/calendar" className="text-sm font-medium text-primary hover:underline">
          Kalender
        </Link>
      </div>
      {upcoming.length ? (
        <div className="space-y-3">
          {upcoming.map((event) => (
            <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(`${event.date}T00:00:00`).toLocaleDateString("id-ID")} · {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <UserDataNotice loading={loading} error={error} empty="Belum ada pengingat." />
      )}
    </Card>
  )
}
