"use client"

import { ArrowUpRight, CheckCircle2, Clock3, FolderKanban, ListTodo } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useState } from "react"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { ProjectRecord, TaskRecord } from "@/lib/user-data"
import { UserDataNotice } from "@/components/user-data-notice"

export function StatsCards() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const { items: projects, loading: projectsLoading, error: projectError } =
    useUserCollection<ProjectRecord>("projects")
  const { items: tasks, loading: tasksLoading, error: taskError } =
    useUserCollection<TaskRecord>("tasks")
  const today = new Date().toISOString().slice(0, 10)
  const dueSoon = tasks.filter(
    (task) => !task.completed && task.dueDate >= today && task.dueDate <= addDays(today, 7),
  ).length
  const loading = projectsLoading || tasksLoading
  const error = projectError || taskError
  const stats = [
    { title: "Total Project", value: projects.length, icon: FolderKanban, primary: true },
    { title: "Tugas Selesai", value: tasks.filter((task) => task.completed).length, icon: CheckCircle2 },
    { title: "Tugas Aktif", value: tasks.filter((task) => !task.completed).length, icon: ListTodo },
    { title: "Tenggat 7 Hari", value: dueSoon, icon: Clock3 },
  ]

  return (
    <div className="space-y-2">
      {error && <UserDataNotice loading={false} error={error} empty="" />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`p-4 transition-all duration-300 ${
              stat.primary ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
            } ${hoveredCard === index ? "scale-[1.02] shadow-xl" : "shadow-md"}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium opacity-85">{stat.title}</h3>
              <div className={`rounded-full p-2 ${stat.primary ? "bg-primary-foreground/15" : "bg-primary/10"}`}>
                <stat.icon className={`size-4 ${stat.primary ? "" : "text-primary"}`} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold">{loading ? "—" : stat.value}</p>
            <ArrowUpRight className="mt-2 size-4 opacity-60" aria-hidden="true" />
          </Card>
        ))}
      </div>
    </div>
  )
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00`)
  result.setDate(result.getDate() + days)
  return result.toISOString().slice(0, 10)
}
