"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { TaskRecord } from "@/lib/user-data"

export function ProjectAnalytics() {
  const { items: tasks, loading, error } = useUserCollection<TaskRecord>("tasks")
  const chartData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const dayKey = date.toISOString().slice(0, 10)
      return {
        day: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date),
        label: date.toLocaleDateString("id-ID"),
        tasks: tasks.filter((task) => new Date(task.createdAt).toISOString().slice(0, 10) === dayKey).length,
      }
    })
  }, [tasks])
  const total = chartData.reduce((sum, item) => sum + item.tasks, 0)
  const average = (total / chartData.length).toFixed(1)
  const peak = Math.max(0, ...chartData.map((item) => item.tasks))

  return (
    <Card className="space-y-4 bg-gradient-to-br from-background to-muted/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Aktivitas Tugas</h2>
        <span className="text-xs text-muted-foreground">7 hari terakhir</span>
      </div>
      {error ? (
        <UserDataNotice loading={false} error={error} empty="" />
      ) : loading ? (
        <UserDataNotice loading error={null} empty="" />
      ) : (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(value) => [`${value} tugas`, "Dibuat"]}
                  labelFormatter={(_, payload) => payload[0]?.payload.label ?? ""}
                />
                <Bar dataKey="tasks" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between border-t pt-3 text-sm">
            <p className="text-muted-foreground">
              Rata-rata: <span className="font-semibold text-foreground">{average} tugas/hari</span>
            </p>
            <p className="text-muted-foreground">
              Terbanyak: <span className="font-semibold text-foreground">{peak} tugas</span>
            </p>
          </div>
        </>
      )}
    </Card>
  )
}
