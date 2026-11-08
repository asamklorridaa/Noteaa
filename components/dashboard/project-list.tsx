"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { FolderKanban, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { ProjectRecord } from "@/lib/user-data"

export function ProjectList() {
  const { items: projects, loading, error, addItem, deleteItem } =
    useUserCollection<ProjectRecord>("projects")
  const [name, setName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return
    setActionError(null)
    try {
      await addItem({ name: cleanName, dueDate, createdAt: Date.now() })
      setName("")
      setDueDate("")
    } catch {
      setActionError("Project gagal disimpan. Silakan coba lagi.")
    }
  }

  async function removeProject(id: string) {
    setActionError(null)
    try {
      await deleteItem(id)
    } catch {
      setActionError("Project gagal dihapus. Silakan coba lagi.")
    }
  }

  return (
    <Card className="space-y-4 p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Project</h2>
        <Link href="/project" className="text-sm font-medium text-primary hover:underline">
          Lihat semua
        </Link>
      </div>

      <form onSubmit={createProject} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama project"
          aria-label="Nama project"
          required
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-label="Tenggat project"
          className="sm:w-40"
        />
        <Button type="submit" size="icon" aria-label="Tambah project" disabled={!name.trim()}>
          <Plus className="size-4" />
        </Button>
      </form>

      {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}

      {projects.length ? (
        <div className="space-y-2">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-3 rounded-lg border p-3">
              <FolderKanban className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{project.name}</p>
                {project.dueDate && (
                  <p className="text-xs text-muted-foreground">Tenggat: {project.dueDate}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Hapus ${project.name}`}
                onClick={() => void removeProject(project.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <UserDataNotice loading={loading} error={error} empty="Belum ada project." />
      )}
    </Card>
  )
}
