"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { ProjectAnalytics } from "@/components/dashboard/project-analytics"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { ProjectRecord, TaskRecord } from "@/lib/user-data"

export function AnalyticsContent() {
  const { items: tasks, loading: tasksLoading, error: tasksError } =
    useUserCollection<TaskRecord>("tasks")
  const { items: projects, loading: projectsLoading, error: projectsError } =
    useUserCollection<ProjectRecord>("projects")
  const completed = tasks.filter((task) => task.completed).length
  const active = tasks.length - completed
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const projectStats = useMemo(
    () => [
      { label: "Total tugas", value: tasks.length },
      { label: "Tugas aktif", value: active },
      { label: "Tugas selesai", value: completed },
      { label: "Total project", value: projects.length },
    ],
    [active, completed, projects.length, tasks.length],
  )
  const loading = tasksLoading || projectsLoading
  const error = tasksError || projectsError

  if (error || loading) {
    return <UserDataNotice loading={loading} error={error} empty="" />
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {projectStats.map((stat) => (
          <Card key={stat.label} className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ProjectAnalytics />
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Ringkasan penyelesaian</h2>
          <p className="text-4xl font-bold">{completionRate}%</p>
          <p className="text-sm text-muted-foreground">
            {completed} dari {tasks.length} tugas selesai.
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </Card>
      </div>
    </div>
  )
}
