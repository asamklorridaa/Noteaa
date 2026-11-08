"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { PreferencesRecord } from "@/lib/user-data"

const defaultPreferences: Omit<PreferencesRecord, "id"> = {
  pushNotifications: false,
  dailyLogReminder: true,
  teamUpdates: false,
  theme: "light",
}

const notificationOptions = [
  { key: "pushNotifications", label: "Notifikasi browser", description: "Pemberitahuan saat aplikasi terbuka dan izin browser diberikan" },
  { key: "dailyLogReminder", label: "Pengingat pencatatan rutin", description: "Pengingat harian pukul 08.00 waktu lokal melalui lonceng notifikasi" },
  { key: "teamUpdates", label: "Pembaruan tim", description: "Aktivitas terkait tim" },
] as const

export function SettingsContent() {
  const { user, isLoaded } = useUser()
  const { theme, setTheme } = useTheme()
  const { items, loading, error, setItem } = useUserCollection<PreferencesRecord>("settings")
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const preferences = items[0] ?? { id: "account", ...defaultPreferences }
  const displayName = user?.fullName || user?.username || "Pengguna"
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)

  async function savePreferences(next: Omit<PreferencesRecord, "id">) {
    setSaving(true)
    setActionError(null)
    try {
      await setItem("account", {
        pushNotifications: next.pushNotifications,
        dailyLogReminder: next.dailyLogReminder,
        teamUpdates: next.teamUpdates,
        theme: next.theme,
      })
      return true
    } catch {
      setActionError("Preferensi gagal disimpan. Silakan coba lagi.")
      return false
    } finally {
      setSaving(false)
    }
  }

  async function updateNotificationPreference(
    key: (typeof notificationOptions)[number]["key"],
    checked: boolean,
  ) {
    if (key === "pushNotifications" && checked) {
      if (!("Notification" in window)) {
        setActionError("Browser ini tidak mendukung notifikasi. Pengingat tetap tersedia melalui lonceng aplikasi.")
        return
      }
      try {
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
          await savePreferences({ ...preferences, [key]: checked, theme })
          return
        }
        setActionError("Izin notifikasi browser belum diberikan. Pengingat melalui lonceng aplikasi tetap aktif.")
      } catch {
        setActionError("Izin notifikasi browser tidak dapat diminta. Pengingat melalui lonceng aplikasi tetap aktif.")
      }
      return
    }
    await savePreferences({ ...preferences, [key]: checked, theme })
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="space-y-5 p-6">
        <h2 className="text-lg font-semibold">Akun</h2>
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={displayName} />}
            <AvatarFallback>{isLoaded ? initials : "..."}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{isLoaded ? displayName : "Memuat akun..."}</p>
            <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress ?? ""}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Ubah nama, email, dan foto profil melalui menu akun Clerk di bagian atas halaman.
        </p>
      </Card>

      <Card className="space-y-2 p-6">
        <h2 className="mb-4 text-lg font-semibold">Notifikasi</h2>
        {notificationOptions.map((option) => (
          <div key={option.key} className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
            <div>
              <p className="font-medium">{option.label}</p>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
            <Switch
              checked={preferences[option.key]}
              disabled={loading || saving}
              onCheckedChange={(checked) => void updateNotificationPreference(option.key, checked)}
              aria-label={option.label}
            />
          </div>
        ))}
      </Card>

      <Card className="flex items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-semibold">Mode gelap</h2>
          <p className="text-sm text-muted-foreground">Preferensi tampilan untuk akunmu.</p>
        </div>
        <Switch
          checked={theme === "dark"}
          disabled={loading || saving}
          onCheckedChange={(checked) =>
            void savePreferences({
              ...preferences,
              theme: checked ? "dark" : "light",
            }).then((saved) => {
              if (saved) setTheme(checked ? "dark" : "light")
            })
          }
          aria-label="Mode gelap"
        />
      </Card>
    </div>
  )
}
