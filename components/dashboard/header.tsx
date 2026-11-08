"use client"

import { useEffect, useState } from "react"
import { Search, Bell } from "lucide-react"
import { UserButton, useAuth, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MobileNav } from "./mobile-nav"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { PreferencesRecord } from "@/lib/user-data"
import type { ReactNode } from "react"

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function Header({ title, description, actions }: HeaderProps) {
  const { isLoaded, user } = useUser()
  const { userId } = useAuth()
  const { items: preferences } = useUserCollection<PreferencesRecord>("settings")
  const [reminderOpen, setReminderOpen] = useState(false)
  const [reminderUnread, setReminderUnread] = useState(false)
  const [reminderMessage, setReminderMessage] = useState("Pengingat pencatatan rutin setiap hari pukul 08.00.")
  const displayName = user?.fullName || user?.username || "Pengguna"
  const email = user?.primaryEmailAddress?.emailAddress || ""
  const remindersEnabled = preferences[0]?.dailyLogReminder ?? true
  const browserNotificationsEnabled = preferences[0]?.pushNotifications === true

  useEffect(() => {
    if (!userId || !remindersEnabled) return

    const storageKey = `noteaa:daily-reminder:${userId}`
    let timer: ReturnType<typeof setTimeout>

    function readReminder() {
      try {
        const value = localStorage.getItem(storageKey)
        if (!value) return null
        const parsed: unknown = JSON.parse(value)
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "date" in parsed &&
          typeof parsed.date === "string" &&
          "read" in parsed &&
          typeof parsed.read === "boolean"
        ) {
          return { date: parsed.date, read: parsed.read }
        }
      } catch {
        console.warn("Could not read the saved daily reminder state.")
      }
      return null
    }

    function fireReminder() {
      const today = getLocalDateKey(new Date())
      if (readReminder()?.date !== today) {
        const record = { date: today, read: false }
        try {
          localStorage.setItem(storageKey, JSON.stringify(record))
        } catch {
          console.warn("Could not save the daily reminder state.")
        }
        setReminderUnread(true)
        setReminderMessage("Waktunya mencatat rutinitas harian. Catat aktivitas atau progresmu hari ini.")

        if (browserNotificationsEnabled && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("Waktunya mencatat di Noteaa", {
              body: "Catat aktivitas atau progres rutinitasmu hari ini.",
              icon: "/icon.svg",
            })
          } catch (error) {
            console.warn("Could not display the daily browser notification.", error)
          }
        }
      }

      scheduleNextReminder()
    }

    function scheduleNextReminder() {
      const now = new Date()
      const next = new Date(now)
      next.setHours(8, 0, 0, 0)
      if (next <= now) next.setDate(next.getDate() + 1)
      timer = setTimeout(fireReminder, next.getTime() - now.getTime())
    }

    const savedReminder = readReminder()
    if (savedReminder?.date === getLocalDateKey(new Date())) {
      setReminderUnread(!savedReminder.read)
      setReminderMessage("Waktunya mencatat rutinitas harian. Catat aktivitas atau progresmu hari ini.")
      scheduleNextReminder()
    } else if (new Date().getHours() >= 8) {
      fireReminder()
      return () => clearTimeout(timer)
    } else {
      setReminderUnread(false)
      scheduleNextReminder()
    }

    return () => clearTimeout(timer)
  }, [browserNotificationsEnabled, remindersEnabled, userId])

  function toggleReminder() {
    const nextOpen = !reminderOpen
    setReminderOpen(nextOpen)
    if (nextOpen && reminderUnread && userId) {
      setReminderUnread(false)
      try {
        localStorage.setItem(`noteaa:daily-reminder:${userId}`, JSON.stringify({
          date: getLocalDateKey(new Date()),
          read: true,
        }))
      } catch {
        console.warn("Could not mark the daily reminder as read.")
      }
    }
  }

  return (
    <header className="space-y-3 md:space-y-4 animate-slide-in-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <MobileNav />

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search task"
              className="pl-9 pr-3 md:pr-16 h-9 text-sm bg-card border-border transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
            />
            <kbd className="hidden md:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted rounded border border-border">
              ⌘F
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notifikasi pengingat harian"
              aria-expanded={reminderOpen}
              aria-controls="daily-reminder-panel"
              onClick={toggleReminder}
              className="relative h-8 w-8 transition-all duration-300 hover:scale-110 hover:bg-secondary"
            >
              <Bell className="size-4" />
              {reminderUnread && (
                <span className="absolute right-1.5 top-1.5 size-1.5 animate-pulse rounded-full bg-destructive" />
              )}
            </Button>
            {reminderOpen && (
              <div
                id="daily-reminder-panel"
                role="status"
                className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card p-4 text-sm shadow-lg"
              >
                <p className="font-semibold">Pengingat harian</p>
                <p className="mt-1 text-muted-foreground">{reminderMessage}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {remindersEnabled ? "Pengingat aktif pukul 08.00 waktu lokal." : "Pengingat harian sedang dimatikan di Pengaturan."}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-border">
            <UserButton />
            <div className="text-xs hidden sm:block">
              <p className="font-semibold text-foreground">{isLoaded ? displayName : "Memuat akun..."}</p>
              <p className="text-muted-foreground text-[10px]">{email}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-xs md:text-sm text-muted-foreground">{description}</p>
      </div>

      {actions && <div className="flex flex-col sm:flex-row gap-2">{actions}</div>}
    </header>
  )
}
