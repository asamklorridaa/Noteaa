import { getAdminFirestore } from "@/lib/firebase-admin"
import { getAuthenticatedUserId, getUserCollection } from "@/lib/user-data-api"
import type { ChatAction } from "@/lib/chat-actions"

export const runtime = "nodejs"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPriority(value: unknown): value is "High" | "Medium" | "Low" {
  return value === "High" || value === "Medium" || value === "Low"
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 1500 && !value.includes("/")
}

function isValidTags(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 10 && value.every((tag) => typeof tag === "string" && tag.length <= 40)
}

function validateActions(value: unknown): ChatAction[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 8) return null

  const actions: ChatAction[] = []
  for (const item of value) {
    if (!isRecord(item)) return null

    if (
      item.type === "create_task" &&
      typeof item.title === "string" &&
      item.title.trim().length > 0 &&
      item.title.length <= 200 &&
      typeof item.project === "string" &&
      item.project.length <= 200 &&
      isPriority(item.priority) &&
      typeof item.dueDate === "string" &&
      item.dueDate.length <= 20 &&
      isValidTags(item.tags)
    ) {
      actions.push({
        type: "create_task",
        title: item.title.trim(),
        project: item.project.trim(),
        priority: item.priority,
        dueDate: item.dueDate,
        tags: item.tags,
      })
      continue
    }

    if (item.type === "update_task" && isValidId(item.taskId) && isRecord(item.updates)) {
      const updates = item.updates
      const cleanUpdates: Extract<ChatAction, { type: "update_task" }>["updates"] = {}
      if (typeof updates.title === "string" && updates.title.trim() && updates.title.length <= 200) {
        cleanUpdates.title = updates.title.trim()
      }
      if (typeof updates.project === "string" && updates.project.length <= 200) {
        cleanUpdates.project = updates.project.trim()
      }
      if (isPriority(updates.priority)) cleanUpdates.priority = updates.priority
      if (typeof updates.dueDate === "string" && updates.dueDate.length <= 20) cleanUpdates.dueDate = updates.dueDate
      if (isValidTags(updates.tags)) cleanUpdates.tags = updates.tags
      if (typeof updates.completed === "boolean") cleanUpdates.completed = updates.completed
      if (!Object.keys(cleanUpdates).length) return null
      actions.push({ type: "update_task", taskId: item.taskId, taskTitle: "", updates: cleanUpdates })
      continue
    }

    if (item.type === "delete_task" && isValidId(item.taskId)) {
      actions.push({ type: "delete_task", taskId: item.taskId, taskTitle: "" })
      continue
    }

    if (
      item.type === "create_project" &&
      typeof item.name === "string" &&
      item.name.trim() &&
      item.name.length <= 200 &&
      typeof item.dueDate === "string" &&
      item.dueDate.length <= 20
    ) {
      actions.push({ type: "create_project", name: item.name.trim(), dueDate: item.dueDate })
      continue
    }

    if (item.type === "update_project" && isValidId(item.projectId) && isRecord(item.updates)) {
      const updates: Extract<ChatAction, { type: "update_project" }>["updates"] = {}
      if (typeof item.updates.name === "string" && item.updates.name.trim() && item.updates.name.length <= 200) {
        updates.name = item.updates.name.trim()
      }
      if (typeof item.updates.dueDate === "string" && item.updates.dueDate.length <= 20) {
        updates.dueDate = item.updates.dueDate
      }
      if (!Object.keys(updates).length) return null
      actions.push({ type: "update_project", projectId: item.projectId, projectName: "", updates })
      continue
    }

    if (item.type === "delete_project" && isValidId(item.projectId)) {
      actions.push({ type: "delete_project", projectId: item.projectId, projectName: "" })
      continue
    }

    if (
      item.type === "create_event" &&
      typeof item.title === "string" &&
      item.title.trim() &&
      item.title.length <= 200 &&
      typeof item.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      typeof item.time === "string" &&
      item.time.length <= 10
    ) {
      actions.push({ type: "create_event", title: item.title.trim(), date: item.date, time: item.time })
      continue
    }

    if (item.type === "update_event" && isValidId(item.eventId) && isRecord(item.updates)) {
      const updates: Extract<ChatAction, { type: "update_event" }>["updates"] = {}
      if (typeof item.updates.title === "string" && item.updates.title.trim() && item.updates.title.length <= 200) {
        updates.title = item.updates.title.trim()
      }
      if (typeof item.updates.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.updates.date)) {
        updates.date = item.updates.date
      }
      if (typeof item.updates.time === "string" && item.updates.time.length <= 10) {
        updates.time = item.updates.time
      }
      if (!Object.keys(updates).length) return null
      actions.push({ type: "update_event", eventId: item.eventId, eventTitle: "", updates })
      continue
    }

    if (item.type === "delete_event" && isValidId(item.eventId)) {
      actions.push({ type: "delete_event", eventId: item.eventId, eventTitle: "" })
      continue
    }

    if (
      item.type === "create_note" &&
      typeof item.title === "string" &&
      item.title.trim() &&
      item.title.length <= 200 &&
      typeof item.content === "string" &&
      item.content.length <= 10_000
    ) {
      actions.push({ type: "create_note", title: item.title.trim(), content: item.content.trim() })
      continue
    }

    if (item.type === "update_note" && isValidId(item.noteId) && isRecord(item.updates)) {
      const updates: Extract<ChatAction, { type: "update_note" }>["updates"] = {}
      if (typeof item.updates.title === "string" && item.updates.title.trim() && item.updates.title.length <= 200) {
        updates.title = item.updates.title.trim()
      }
      if (typeof item.updates.content === "string" && item.updates.content.length <= 10_000) {
        updates.content = item.updates.content
      }
      if (!Object.keys(updates).length) return null
      actions.push({ type: "update_note", noteId: item.noteId, noteTitle: "", updates })
      continue
    }

    if (item.type === "delete_note" && isValidId(item.noteId)) {
      actions.push({ type: "delete_note", noteId: item.noteId, noteTitle: "" })
      continue
    }

    return null
  }

  return actions
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
    return Response.json({ error: "Tindakan tidak valid." }, { status: 400 })
  }

  const actions = isRecord(body) ? validateActions(body.actions) : null
  if (!actions) return Response.json({ error: "Tindakan tidak valid." }, { status: 400 })

  try {
    const collectionForAction = (action: ChatAction) => {
      switch (action.type) {
        case "update_task":
        case "delete_task":
          return { collection: "tasks", id: action.taskId, operation: action.type === "delete_task" ? "delete" : "update" }
        case "update_project":
        case "delete_project":
          return { collection: "projects", id: action.projectId, operation: action.type === "delete_project" ? "delete" : "update" }
        case "update_event":
        case "delete_event":
          return { collection: "events", id: action.eventId, operation: action.type === "delete_event" ? "delete" : "update" }
        case "update_note":
        case "delete_note":
          return { collection: "notes", id: action.noteId, operation: action.type === "delete_note" ? "delete" : "update" }
        default:
          return null
      }
    }
    const existingActions = actions
      .map((action) => ({ action, target: collectionForAction(action) }))
      .filter((entry): entry is { action: ChatAction; target: NonNullable<ReturnType<typeof collectionForAction>> } =>
        entry.target !== null,
      )
    const existingDocuments = await Promise.all(
      existingActions.map(({ target }) => getUserCollection(userId, target.collection).doc(target.id).get()),
    )
    if (existingDocuments.some((document) => !document.exists)) {
      return Response.json({ error: "Sebagian data sudah tidak ditemukan. Muat ulang chat lalu coba lagi." }, { status: 409 })
    }

    const firestore = getAdminFirestore()
    const batch = firestore.batch()
    for (const action of actions) {
      switch (action.type) {
        case "create_task":
          batch.create(getUserCollection(userId, "tasks").doc(), { ...action, createdAt: Date.now() })
          break
        case "update_task":
          batch.update(getUserCollection(userId, "tasks").doc(action.taskId), action.updates)
          break
        case "delete_task":
          batch.delete(getUserCollection(userId, "tasks").doc(action.taskId))
          break
        case "create_project":
          batch.create(getUserCollection(userId, "projects").doc(), { ...action, createdAt: Date.now() })
          break
        case "update_project":
          batch.update(getUserCollection(userId, "projects").doc(action.projectId), action.updates)
          break
        case "delete_project":
          batch.delete(getUserCollection(userId, "projects").doc(action.projectId))
          break
        case "create_event":
          batch.create(getUserCollection(userId, "events").doc(), { ...action, createdAt: Date.now() })
          break
        case "update_event":
          batch.update(getUserCollection(userId, "events").doc(action.eventId), action.updates)
          break
        case "delete_event":
          batch.delete(getUserCollection(userId, "events").doc(action.eventId))
          break
        case "create_note":
          batch.create(getUserCollection(userId, "notes").doc(), { ...action, updatedAt: Date.now() })
          break
        case "update_note":
          batch.update(getUserCollection(userId, "notes").doc(action.noteId), {
            ...action.updates,
            updatedAt: Date.now(),
          })
          break
        case "delete_note":
          batch.delete(getUserCollection(userId, "notes").doc(action.noteId))
          break
      }
    }
    await batch.commit()

    return Response.json(
      { message: `${actions.length} perubahan berhasil diterapkan.` },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    console.error("Failed to apply confirmed AI actions.", error)
    return Response.json({ error: "Perubahan gagal diterapkan. Silakan coba lagi." }, { status: 503 })
  }
}
