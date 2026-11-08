"use client"

import { Card } from "@/components/ui/card"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { TaskRecord } from "@/lib/user-data"

export function ProjectProgress() {
  const { items: tasks, loading, error } = useUserCollection<TaskRecord>("tasks")
  const completed = tasks.filter((task) => task.completed).length
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const circumference = 2 * Math.PI * 70

  return (
    <Card className="space-y-4 overflow-hidden p-5">
      <h2 className="text-lg font-semibold">Progres Tugas</h2>
      {error || loading ? (
        <UserDataNotice loading={loading} error={error} empty="" />
      ) : (
        <>
          <div className="relative mx-auto size-40">
            <svg className="size-full -rotate-90" viewBox="0 0 160 160" aria-label={`Progres ${progress}%`}>
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted/30" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                strokeLinecap="round"
                className="text-primary transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{progress}%</span>
              <span className="text-xs text-muted-foreground">{completed} dari {tasks.length} tugas</span>
            </div>
          </div>
          {!tasks.length && <p className="text-center text-sm text-muted-foreground">Tambahkan tugas untuk melihat progres.</p>}
        </>
      )}
    </Card>
  )
}
