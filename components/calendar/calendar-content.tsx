"use client"

import { useMemo, useState, type FormEvent } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { EventRecord } from "@/lib/user-data"

const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function CalendarContent() {
  const { items: events, loading, error, addItem, deleteItem } =
    useUserCollection<EventRecord>("events")
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()))
  const [title, setTitle] = useState("")
  const [time, setTime] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const offset = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ]
  }, [currentMonth])
  const eventDates = new Set(events.map((event) => event.date))
  const selectedEvents = events
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  function changeMonth(amount: number) {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1))
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    setActionError(null)
    try {
      await addItem({ title: cleanTitle, date: selectedDate, time, createdAt: Date.now() })
      setTitle("")
      setTime("")
    } catch {
      setActionError("Acara gagal disimpan. Silakan coba lagi.")
    }
  }

  async function removeEvent(id: string) {
    setActionError(null)
    try {
      await deleteItem(id)
    } catch {
      setActionError("Acara gagal dihapus. Silakan coba lagi.")
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Bulan sebelumnya" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-36 text-center font-semibold">
            {currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </h2>
          <Button type="button" variant="outline" size="icon" aria-label="Bulan berikutnya" onClick={() => changeMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const today = new Date()
            setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
            setSelectedDate(formatDateKey(today))
          }}
        >
          Hari ini
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <Card className="p-3 sm:p-5">
          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground sm:text-sm">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} />
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
              const key = formatDateKey(date)
              const isSelected = selectedDate === key
              const isToday = formatDateKey(new Date()) === key
              return (
                <button
                  type="button"
                  key={key}
                  aria-label={`${day} ${currentMonth.toLocaleDateString("id-ID", { month: "long" })}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDate(key)}
                  className={`relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors ${
                    isSelected ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  } ${isToday && !isSelected ? "ring-1 ring-primary" : ""}`}
                >
                  {day}
                  {eventDates.has(key) && (
                    <span className={`absolute bottom-1 size-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <div>
              <h3 className="font-semibold">Agenda</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <form onSubmit={createEvent} className="space-y-2 border-b pb-4">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nama acara"
              aria-label="Nama acara"
              required
            />
            <div className="flex gap-2">
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} aria-label="Waktu acara" />
              <Button type="submit" size="icon" aria-label="Tambah acara" disabled={!title.trim()}>
                <Plus className="size-4" />
              </Button>
            </div>
          </form>

          {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
          {selectedEvents.length ? (
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <Badge variant="secondary">{event.time || "Waktu belum ditentukan"}</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus ${event.title}`}
                    onClick={() => void removeEvent(event.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <UserDataNotice
              loading={loading}
              error={error}
              empty="Belum ada acara untuk tanggal ini."
            />
          )}
        </Card>
      </div>
    </div>
  )
}
