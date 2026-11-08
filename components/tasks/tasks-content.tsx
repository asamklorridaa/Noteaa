"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Calendar, Plus, Search, Tag, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { TaskRecord } from "@/lib/user-data"

export function TasksContent() {
  const { items: tasks, loading, error, ready, addItem, updateItem, deleteItem } =
    useUserCollection<TaskRecord>("tasks")
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [search, setSearch] = useState("")
  const [title, setTitle] = useState("")
  const [project, setProject] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesFilter =
          filter === "all" || (filter === "completed" ? task.completed : !task.completed)
        const matchesSearch = `${task.title} ${task.project}`.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
      }),
    [filter, search, tasks],
  )

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready) {
      setActionError("Data belum siap. Coba lagi sebentar.")
      return
    }

    const cleanTitle = title.trim()
    if (!cleanTitle) return
    setActionError(null)
    try {
      await addItem({
        title: cleanTitle,
        project: project.trim(),
        priority: "Medium",
        dueDate,
        completed: false,
        tags: [],
        createdAt: Date.now(),
      })
      setTitle("")
      setProject("")
      setDueDate("")
    } catch {
      setActionError("Tugas belum dapat disimpan. Coba lagi sebentar.")
    }
  }

  async function toggleTask(task: TaskRecord, checked: boolean | "indeterminate") {
    setActionError(null)
    try {
      await updateItem(task.id, { completed: checked === true })
    } catch {
      setActionError("Status tugas belum dapat diperbarui. Coba lagi sebentar.")
    }
  }

  async function removeTask(id: string) {
    setActionError(null)
    try {
      await deleteItem(id)
    } catch {
      setActionError("Tugas belum dapat dihapus. Coba lagi sebentar.")
    }
  }

  const activeCount = tasks.filter((task) => !task.completed).length
  const completedCount = tasks.length - activeCount

  return (
    <div className="space-y-5 animate-fade-in">
      <form onSubmit={createTask} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nama tugas"
          aria-label="Nama tugas"
          required
        />
        <Input
          value={project}
          onChange={(event) => setProject(event.target.value)}
          placeholder="Project (opsional)"
          aria-label="Project"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-label="Tenggat tugas"
        />
        <Button type="submit" disabled={!title.trim() || !ready}>
          <Plus className="mr-2 size-4" />
          {ready ? "Tambah tugas" : "Data belum siap"}
        </Button>
      </form>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari tugas..."
          aria-label="Cari tugas"
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["all", `Semua (${tasks.length})`],
          ["active", `Aktif (${activeCount})`],
          ["completed", `Selesai (${completedCount})`],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
            size="sm"
          >
            {label}
          </Button>
        ))}
      </div>

      {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}

      {filteredTasks.length ? (
        <div className="grid gap-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => void toggleTask(task, checked)}
                  aria-label={`Tandai ${task.title} selesai`}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className={`font-semibold ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                      {task.title}
                    </h3>
                    <Badge variant="secondary">{task.priority}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {task.project && (
                      <span className="flex items-center gap-1">
                        <Tag className="size-4" />
                        {task.project}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-4" />
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus ${task.title}`}
                  onClick={() => void removeTask(task.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-2">
          <UserDataNotice
            loading={loading}
            error={error}
            empty={search ? "Tidak ada tugas yang cocok." : "Belum ada tugas. Tambahkan tugas pertamamu."}
          />
        </Card>
      )}
    </div>
  )
}
