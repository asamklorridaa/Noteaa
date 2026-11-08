"use client"

import { useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { NoteRecord } from "@/lib/user-data"

export default function NotesPage() {
  const { items: notes, loading, error, addItem, deleteItem } =
    useUserCollection<NoteRecord>("notes")
  const [search, setSearch] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  async function addNote() {
    const cleanTitle = title.trim()
    const cleanContent = content.trim()
    if (!cleanTitle && !cleanContent) return
    setActionError(null)
    try {
      await addItem({
        title: cleanTitle || "Catatan tanpa judul",
        content: cleanContent,
        updatedAt: Date.now(),
      })
      setTitle("")
      setContent("")
    } catch {
      setActionError("Catatan gagal disimpan. Silakan coba lagi.")
    }
  }

  async function removeNote(id: string) {
    setActionError(null)
    try {
      await deleteItem(id)
    } catch {
      setActionError("Catatan gagal dihapus. Silakan coba lagi.")
    }
  }

  const filteredNotes = notes.filter((note) =>
    `${note.title} ${note.content}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 p-4 lg:ml-64 lg:p-6">
        <Header title="Notes" description="Simpan ide dan catatan pentingmu." />
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(260px,360px)_1fr]">
          <Card className="h-fit space-y-3 p-4">
            <h2 className="font-semibold">Catatan baru</h2>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul catatan"
              aria-label="Judul catatan"
            />
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Tulis catatan di sini..."
              aria-label="Isi catatan"
              rows={6}
            />
            <Button
              type="button"
              onClick={() => void addNote()}
              disabled={!title.trim() && !content.trim()}
              className="w-full"
            >
              <Plus className="mr-2 size-4" />
              Simpan catatan
            </Button>
            <p className="text-xs text-muted-foreground">Catatan disimpan di akunmu.</p>
            {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
          </Card>

          <section className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari catatan..."
                aria-label="Cari catatan"
                className="pl-9"
              />
            </div>
            {filteredNotes.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredNotes.map((note) => (
                  <Card key={note.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{note.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(note.updatedAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Hapus ${note.title}`}
                        onClick={() => void removeNote(note.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{note.content}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-2">
                <UserDataNotice
                  loading={loading}
                  error={error}
                  empty={search ? "Tidak ada catatan yang cocok." : "Belum ada catatan. Buat catatan pertamamu."}
                />
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
