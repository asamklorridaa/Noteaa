"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { Bot, Send, UserRound } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UserDataNotice } from "@/components/user-data-notice"
import { useUserCollection } from "@/hooks/use-user-collection"
import type { ChatAction } from "@/lib/chat-actions"
import type { ChatRecord } from "@/lib/user-data"

export default function ChatbotPage() {
  const conversationRef = useRef<HTMLDivElement>(null)
  const { items, loading, error, addItem } = useUserCollection<ChatRecord>("chatMessages")
  const [prompt, setPrompt] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [applyingActions, setApplyingActions] = useState(false)
  const [proposedActions, setProposedActions] = useState<ChatAction[]>([])
  const messages = [...items].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))

  useEffect(() => {
    const conversation = conversationRef.current
    if (conversation) {
      conversation.scrollTop = conversation.scrollHeight
    }
  }, [messages])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = prompt.trim()
    if (!text) return

    setActionError(null)
    setSending(true)
    const createdAt = Date.now()
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ message: text }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const errorMessage =
          typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : "Asisten AI sedang bermasalah. Coba lagi nanti."
        throw new Error(errorMessage)
      }
      const reply =
        typeof result === "object" && result !== null && "reply" in result && typeof result.reply === "string"
          ? result.reply
          : null
      if (!reply) throw new Error("Asisten AI tidak memberikan jawaban. Coba lagi.")
      const actions =
        typeof result === "object" && result !== null && "actions" in result && Array.isArray(result.actions)
          ? (result.actions as ChatAction[])
          : []

      await addItem({ role: "user", text, createdAt })
      await addItem({ role: "assistant", text: reply, createdAt: createdAt + 1 })
      setProposedActions(actions)
      setPrompt("")
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Pesan gagal dikirim. Silakan coba lagi.")
    } finally {
      setSending(false)
    }
  }

  async function applyActions() {
    if (!proposedActions.length) return
    setActionError(null)
    setApplyingActions(true)
    try {
      const response = await fetch("/api/chat/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ actions: proposedActions }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const errorMessage =
          typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : "Perubahan gagal diterapkan. Silakan coba lagi."
        throw new Error(errorMessage)
      }
      const confirmation =
        typeof result === "object" && result !== null && "message" in result && typeof result.message === "string"
          ? result.message
          : "Perubahan berhasil diterapkan."
      await addItem({ role: "assistant", text: confirmation, createdAt: Date.now() })
      setProposedActions([])
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Perubahan gagal diterapkan. Silakan coba lagi.")
    } finally {
      setApplyingActions(false)
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 lg:ml-64 lg:p-6">
        <div className="shrink-0">
          <Header title="Chatbot" description="Asisten produktivitas untuk membantu pekerjaanmu." />
        </div>
        <Card className="mt-4 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-3 border-b p-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Asisten Noteaa</h2>
              <p className="text-xs text-muted-foreground">Saran produktivitas</p>
            </div>
          </div>

          <div
            ref={conversationRef}
            role="log"
            aria-live="polite"
            aria-label="Percakapan dengan Asisten Noteaa"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <Bot className="mt-2 size-4 shrink-0 text-primary" aria-hidden="true" />
                )}
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.text}
                </p>
                {message.role === "user" && (
                  <UserRound className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            ))}
            {proposedActions.length > 0 && (
              <Card className="space-y-3 border-primary/30 p-4">
                <h3 className="text-sm font-semibold">Usulan perubahan — periksa sebelum diterapkan</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {proposedActions.map((action, index) => (
                    <li key={`${action.type}-${index}`}>
                      {action.type === "create_task" && `Tambah tugas: ${action.title}`}
                      {action.type === "update_task" &&
                        `Atur tugas “${action.taskTitle}”: ${Object.entries(action.updates)
                          .map(([field, value]) => `${field} → ${Array.isArray(value) ? value.join(", ") : String(value)}`)
                          .join(", ")}`}
                      {action.type === "create_note" && `Buat catatan: ${action.title}`}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void applyActions()} disabled={applyingActions}>
                    {applyingActions ? "Menerapkan..." : "Konfirmasi dan terapkan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProposedActions([])}
                    disabled={applyingActions}
                  >
                    Batalkan
                  </Button>
                </div>
              </Card>
            )}
            {!messages.length && (loading || !error) && (
              <UserDataNotice
                loading={loading}
                error={null}
                empty="Belum ada percakapan. Tulis pesan untuk memulai."
              />
            )}
          </div>

          {(error || actionError) && (
            <p role="alert" className="shrink-0 px-4 text-sm text-destructive">
              {actionError || error}
            </p>
          )}
          <form onSubmit={(event) => void sendMessage(event)} className="flex shrink-0 gap-2 border-t p-4">
            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Tulis pertanyaan..."
              aria-label="Pesan untuk asisten"
              maxLength={4000}
              disabled={sending}
            />
            <Button type="submit" size="icon" aria-label="Kirim pesan" disabled={!prompt.trim() || sending}>
              <Send className="size-4" />
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}
