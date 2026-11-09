import {
  getAuthenticatedUserId,
  getUserCollection,
} from "@/lib/user-data-api"
import type { ChatAction } from "@/lib/chat-actions"

export const runtime = "nodejs"

const maxMessageLength = 4_000
const conversationLimit = 12
const contextLimit = 30
const notesContextLimit = 12
const noteContentLimit = 4_000

const sensitiveMessagePatterns = [
  /\b(?:CLERK_SECRET_KEY|OPENROUTER_API_KEY|FIREBASE_ADMIN_PRIVATE_KEY|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)\s*=/i,
  /\bsk_(?:test|live)_[A-Za-z0-9_-]{12,}\b/,
  /\bsk-or-v1-[A-Fa-f0-9]{32,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
]

type TaskContext = {
  id: string
  title: string
  project: string
  priority: "High" | "Medium" | "Low"
  dueDate: string
  completed: boolean
  tags: string[]
}

type ProjectContext = { id: string; name: string; dueDate: string }
type EventContext = { id: string; title: string; date: string; time: string }
type NoteContext = { id: string; title: string; content: string; contentTruncated: boolean; updatedAt: number | null }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPriority(value: unknown): value is "High" | "Medium" | "Low" {
  return value === "High" || value === "Medium" || value === "Low"
}

function parseActions(
  value: unknown,
  tasks: TaskContext[],
  projects: ProjectContext[],
  events: EventContext[],
  notes: NoteContext[],
): ChatAction[] {
  if (!Array.isArray(value)) return []

  const taskById = new Map(tasks.map((item) => [item.id, item]))
  const projectById = new Map(projects.map((item) => [item.id, item]))
  const eventById = new Map(events.map((item) => [item.id, item]))
  const noteById = new Map(notes.map((item) => [item.id, item]))
  const parsed: ChatAction[] = []

  for (const candidate of value.slice(0, 8)) {
    if (!isRecord(candidate)) continue

    if (
      candidate.type === "create_task" &&
      typeof candidate.title === "string" &&
      candidate.title.trim().length > 0 &&
      candidate.title.length <= 200 &&
      (candidate.project === undefined || (typeof candidate.project === "string" && candidate.project.length <= 200)) &&
      (candidate.priority === undefined || isPriority(candidate.priority)) &&
      (candidate.dueDate === undefined || (typeof candidate.dueDate === "string" && candidate.dueDate.length <= 20)) &&
      (candidate.tags === undefined ||
        (Array.isArray(candidate.tags) &&
          candidate.tags.length <= 10 &&
          candidate.tags.every((tag) => typeof tag === "string" && tag.length <= 40)))
    ) {
      parsed.push({
        type: "create_task",
        title: candidate.title.trim(),
        project: typeof candidate.project === "string" ? candidate.project.trim() : "",
        priority: isPriority(candidate.priority) ? candidate.priority : "Medium",
        dueDate: typeof candidate.dueDate === "string" ? candidate.dueDate : "",
        tags: Array.isArray(candidate.tags) ? candidate.tags : [],
      })
      continue
    }

    if (candidate.type === "update_task" && typeof candidate.taskId === "string" && isRecord(candidate.updates)) {
      const task = taskById.get(candidate.taskId)
      const updates = candidate.updates
      const cleanUpdates: Extract<ChatAction, { type: "update_task" }>["updates"] = {}
      if (typeof updates.title === "string" && updates.title.trim() && updates.title.length <= 200) {
        cleanUpdates.title = updates.title.trim()
      }
      if (typeof updates.project === "string" && updates.project.length <= 200) {
        cleanUpdates.project = updates.project.trim()
      }
      if (isPriority(updates.priority)) cleanUpdates.priority = updates.priority
      if (typeof updates.dueDate === "string" && updates.dueDate.length <= 20) {
        cleanUpdates.dueDate = updates.dueDate
      }
      if (
        Array.isArray(updates.tags) &&
        updates.tags.length <= 10 &&
        updates.tags.every((tag) => typeof tag === "string" && tag.length <= 40)
      ) {
        cleanUpdates.tags = updates.tags
      }
      if (typeof updates.completed === "boolean") cleanUpdates.completed = updates.completed

      if (task && Object.keys(cleanUpdates).length > 0) {
        parsed.push({
          type: "update_task",
          taskId: task.id,
          taskTitle: task.title,
          updates: cleanUpdates,
        })
      }
      continue
    }

    if (candidate.type === "delete_task" && typeof candidate.taskId === "string") {
      const task = taskById.get(candidate.taskId)
      if (task) parsed.push({ type: "delete_task", taskId: task.id, taskTitle: task.title })
      continue
    }

    if (
      candidate.type === "create_project" &&
      typeof candidate.name === "string" &&
      candidate.name.trim() &&
      candidate.name.length <= 200 &&
      (candidate.dueDate === undefined || (typeof candidate.dueDate === "string" && candidate.dueDate.length <= 20))
    ) {
      parsed.push({
        type: "create_project",
        name: candidate.name.trim(),
        dueDate: typeof candidate.dueDate === "string" ? candidate.dueDate : "",
      })
      continue
    }

    if (candidate.type === "update_project" && typeof candidate.projectId === "string" && isRecord(candidate.updates)) {
      const project = projectById.get(candidate.projectId)
      const updates: Extract<ChatAction, { type: "update_project" }>["updates"] = {}
      if (typeof candidate.updates.name === "string" && candidate.updates.name.trim() && candidate.updates.name.length <= 200) {
        updates.name = candidate.updates.name.trim()
      }
      if (typeof candidate.updates.dueDate === "string" && candidate.updates.dueDate.length <= 20) {
        updates.dueDate = candidate.updates.dueDate
      }
      if (project && Object.keys(updates).length) {
        parsed.push({ type: "update_project", projectId: project.id, projectName: project.name, updates })
      }
      continue
    }

    if (candidate.type === "delete_project" && typeof candidate.projectId === "string") {
      const project = projectById.get(candidate.projectId)
      if (project) {
        parsed.push({ type: "delete_project", projectId: project.id, projectName: project.name })
      }
      continue
    }

    if (
      candidate.type === "create_event" &&
      typeof candidate.title === "string" &&
      candidate.title.trim() &&
      candidate.title.length <= 200 &&
      typeof candidate.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(candidate.date) &&
      (candidate.time === undefined || (typeof candidate.time === "string" && candidate.time.length <= 10))
    ) {
      parsed.push({
        type: "create_event",
        title: candidate.title.trim(),
        date: candidate.date,
        time: typeof candidate.time === "string" ? candidate.time : "",
      })
      continue
    }

    if (candidate.type === "update_event" && typeof candidate.eventId === "string" && isRecord(candidate.updates)) {
      const event = eventById.get(candidate.eventId)
      const updates: Extract<ChatAction, { type: "update_event" }>["updates"] = {}
      if (typeof candidate.updates.title === "string" && candidate.updates.title.trim() && candidate.updates.title.length <= 200) {
        updates.title = candidate.updates.title.trim()
      }
      if (typeof candidate.updates.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.updates.date)) {
        updates.date = candidate.updates.date
      }
      if (typeof candidate.updates.time === "string" && candidate.updates.time.length <= 10) {
        updates.time = candidate.updates.time
      }
      if (event && Object.keys(updates).length) {
        parsed.push({ type: "update_event", eventId: event.id, eventTitle: event.title, updates })
      }
      continue
    }

    if (candidate.type === "delete_event" && typeof candidate.eventId === "string") {
      const event = eventById.get(candidate.eventId)
      if (event) parsed.push({ type: "delete_event", eventId: event.id, eventTitle: event.title })
      continue
    }

    if (
      candidate.type === "create_note" &&
      typeof candidate.title === "string" &&
      candidate.title.trim().length > 0 &&
      candidate.title.length <= 200 &&
      typeof candidate.content === "string" &&
      candidate.content.length <= 10_000
    ) {
      parsed.push({
        type: "create_note",
        title: candidate.title.trim(),
        content: candidate.content.trim(),
      })
      continue
    }

    if (candidate.type === "update_note" && typeof candidate.noteId === "string" && isRecord(candidate.updates)) {
      const note = noteById.get(candidate.noteId)
      const updates: Extract<ChatAction, { type: "update_note" }>["updates"] = {}
      if (typeof candidate.updates.title === "string" && candidate.updates.title.trim() && candidate.updates.title.length <= 200) {
        updates.title = candidate.updates.title.trim()
      }
      if (typeof candidate.updates.content === "string" && candidate.updates.content.length <= 10_000) {
        updates.content = candidate.updates.content
      }
      if (note && Object.keys(updates).length) {
        parsed.push({ type: "update_note", noteId: note.id, noteTitle: note.title, updates })
      }
      continue
    }

    if (candidate.type === "delete_note" && typeof candidate.noteId === "string") {
      const note = noteById.get(candidate.noteId)
      if (note) parsed.push({ type: "delete_note", noteId: note.id, noteTitle: note.title })
    }
  }

  return parsed
}

function parseAssistantResponse(
  content: string,
  tasks: TaskContext[],
  projects: ProjectContext[],
  events: EventContext[],
  notes: NoteContext[],
) {
  const json = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  try {
    const result: unknown = JSON.parse(json)
    if (isRecord(result) && typeof result.reply === "string" && result.reply.trim()) {
      return { reply: result.reply.trim(), actions: parseActions(result.actions, tasks, projects, events, notes) }
    }
  } catch {
    // Fall back to the model's plain-text response when it does not follow the requested JSON format.
  }
  return { reply: content.trim(), actions: [] as ChatAction[] }
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  return !origin || origin === new URL(request.url).origin
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return Response.json({ error: "Silakan login kembali." }, { status: 401 })
  if (!isSameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Pesan tidak valid." }, { status: 400 })
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? body.message
      : undefined
  if (typeof message !== "string" || !message.trim() || message.length > maxMessageLength) {
    return Response.json({ error: "Pesan tidak valid." }, { status: 400 })
  }
  if (sensitiveMessagePatterns.some((pattern) => pattern.test(message))) {
    return Response.json(
      { error: "Pesan tampaknya berisi credential atau API key. Hapus credential sebelum mengirim pesan." },
      { status: 400 },
    )
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error("OpenRouter is not configured: OPENROUTER_API_KEY is missing.")
    return Response.json({ error: "Layanan AI belum dikonfigurasi." }, { status: 503 })
  }

  try {
    const [historySnapshot, tasksSnapshot, projectsSnapshot, eventsSnapshot, notesSnapshot] = await Promise.all([
      getUserCollection(userId, "chatMessages").orderBy("createdAt", "desc").limit(conversationLimit).get(),
      getUserCollection(userId, "tasks").limit(contextLimit).get(),
      getUserCollection(userId, "projects").limit(contextLimit).get(),
      getUserCollection(userId, "events").limit(contextLimit).get(),
      getUserCollection(userId, "notes").orderBy("updatedAt", "desc").limit(notesContextLimit).get(),
    ])
    const history = historySnapshot.docs
      .reverse()
      .map((document) => document.data())
      .filter(
        (item): item is { role: "user" | "assistant"; text: string } =>
          (item.role === "user" || item.role === "assistant") && typeof item.text === "string",
      )
      .map((item) => ({ role: item.role, content: item.text }))
    const tasks: TaskContext[] = tasksSnapshot.docs.map((document) => {
      const data = document.data()
      return {
        id: document.id,
        title: typeof data.title === "string" ? data.title : "",
        project: typeof data.project === "string" ? data.project : "",
        priority: isPriority(data.priority) ? data.priority : "Medium",
        dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
        completed: data.completed === true,
        tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string") : [],
      }
    })
    const projects: ProjectContext[] = projectsSnapshot.docs.map((document) => {
      const data = document.data()
      return {
        id: document.id,
        name: typeof data.name === "string" ? data.name : "",
        dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
      }
    })
    const events: EventContext[] = eventsSnapshot.docs.map((document) => {
      const data = document.data()
      return {
        id: document.id,
        title: typeof data.title === "string" ? data.title : "",
        date: typeof data.date === "string" ? data.date : "",
        time: typeof data.time === "string" ? data.time : "",
      }
    })
    const notes: NoteContext[] = notesSnapshot.docs.map((document) => {
      const data = document.data()
      return {
        id: document.id,
        title: typeof data.title === "string" ? data.title : "",
        content:
          typeof data.content === "string"
            ? data.content.slice(0, noteContentLimit)
            : "",
        contentTruncated:
          typeof data.content === "string" && data.content.length > noteContentLimit,
        updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : null,
      }
    })

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": new URL(request.url).origin,
        "X-Title": "Noteaa",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        messages: [
          {
            role: "system",
            content: `Kamu adalah asisten produktivitas Noteaa. Jawab dalam bahasa Indonesia dengan ramah, jelas, dan praktis. Kamu bisa membaca dan mengelola data Tasks, Calendar (acara), Project, dan Notes pengguna. Dashboard dan Analytics adalah ringkasan otomatis dari data tersebut; ubah data sumbernya agar ringkasannya ikut berubah. Jangan mengarang data yang tidak tersedia. Semua perubahan harus berupa usulan JSON dan baru diterapkan setelah pengguna menekan tombol konfirmasi.

Balas HANYA JSON valid dengan bentuk {"reply":"jawaban singkat untuk pengguna","actions":[...]}. Gunakan actions [] jika tidak perlu mengubah data. Jenis tindakan:
- {"type":"create_task","title":"...","project":"nama project atau string kosong","priority":"High|Medium|Low","dueDate":"YYYY-MM-DD atau string kosong","tags":[]}
- {"type":"update_task","taskId":"ID tugas persis dari konteks","updates":{"title":"...","project":"...","priority":"High|Medium|Low","dueDate":"YYYY-MM-DD atau string kosong","tags":[],"completed":false}}. Sertakan hanya field yang memang perlu diubah. Jangan usulkan taskId yang tidak ada.
- {"type":"delete_task","taskId":"ID tugas persis dari konteks"}
- {"type":"create_project","name":"...","dueDate":"YYYY-MM-DD atau string kosong"}
- {"type":"update_project","projectId":"ID project persis dari konteks","updates":{"name":"...","dueDate":"YYYY-MM-DD atau string kosong"}}
- {"type":"delete_project","projectId":"ID project persis dari konteks"}
- {"type":"create_event","title":"...","date":"YYYY-MM-DD","time":"HH:mm atau string kosong"}
- {"type":"update_event","eventId":"ID acara persis dari konteks","updates":{"title":"...","date":"YYYY-MM-DD","time":"HH:mm atau string kosong"}}
- {"type":"delete_event","eventId":"ID acara persis dari konteks"}
- {"type":"create_note","title":"...","content":"..."}
- {"type":"update_note","noteId":"ID catatan persis dari konteks","updates":{"title":"...","content":"..."}}
- {"type":"delete_note","noteId":"ID catatan persis dari konteks"}

Maksimal 8 tindakan per jawaban. Tindakan hapus hanya boleh diusulkan jika pengguna secara jelas meminta penghapusan, dan harus menyebut item yang tepat berdasarkan ID/konteks. Jangan pernah menghapus data untuk menafsirkan permintaan yang ambigu. Jika ada beberapa item yang cocok atau detail penting belum jelas, tanyakan dahulu dan gunakan actions []. Jangan mengubah data hanya untuk permintaan informasi.

Tugas pengguna:\n${JSON.stringify(tasks)}\nProject pengguna:\n${JSON.stringify(projects)}\nAcara kalender pengguna:\n${JSON.stringify(events)}\nCatatan pengguna (judul dan isi; contentTruncated=true berarti isi dipotong):\n${JSON.stringify(notes)}\nJika isi catatan kosong, beri tahu bahwa catatan tersebut memang belum memiliki isi. Jangan mengarang isi catatan. Jika isi terpotong, sampaikan bahwa yang ditampilkan hanya sebagian isi.\nTanggal hari ini: ${new Date().toISOString().slice(0, 10)}`,
          },
          ...history,
          { role: "user", content: message.trim() },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) {
      console.error("OpenRouter request failed with status:", response.status)
      const error =
        response.status === 401 || response.status === 403
          ? "Konfigurasi API AI ditolak. Periksa OPENROUTER_API_KEY di environment deployment."
          : response.status === 402
            ? "Kredit atau saldo OpenRouter tidak mencukupi."
            : response.status === 404
              ? "Model AI tidak ditemukan atau sedang tidak tersedia. Periksa OPENROUTER_MODEL."
              : response.status === 429
                ? "Batas penggunaan AI tercapai. Tunggu sebentar lalu coba lagi."
                : response.status >= 500
                  ? "Layanan OpenRouter sedang bermasalah. Coba lagi nanti."
                  : "Permintaan AI ditolak. Periksa konfigurasi model lalu coba lagi."
      return Response.json({ error }, { status: 502 })
    }

    const result: unknown = await response.json()
    const content =
      typeof result === "object" &&
      result !== null &&
      "choices" in result &&
      Array.isArray(result.choices) &&
      typeof result.choices[0] === "object" &&
      result.choices[0] !== null &&
      "message" in result.choices[0] &&
      typeof result.choices[0].message === "object" &&
      result.choices[0].message !== null &&
      "content" in result.choices[0].message
        ? result.choices[0].message.content
        : undefined

    if (typeof content !== "string" || !content.trim()) {
      console.error("OpenRouter returned an empty or unsupported response.")
      return Response.json({ error: "Asisten AI tidak memberikan jawaban. Coba lagi." }, { status: 502 })
    }

    const assistantResponse = parseAssistantResponse(content, tasks, projects, events, notes)
    return Response.json(assistantResponse, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Failed to generate an AI response.", error)
    if (error instanceof Error && error.name === "TimeoutError") {
      return Response.json({ error: "Layanan AI terlalu lama merespons. Coba lagi sebentar lagi." }, { status: 504 })
    }
    return Response.json({ error: "Asisten AI sedang bermasalah. Coba lagi nanti." }, { status: 502 })
  }
}
