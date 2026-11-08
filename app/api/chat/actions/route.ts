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

    if (
      item.type === "create_note" &&
      typeof item.title === "string" &&
      item.title.trim().length > 0 &&
      item.title.length <= 200 &&
      typeof item.content === "string" &&
      item.content.trim().length > 0 &&
      item.content.length <= 10_000
    ) {
      actions.push({ type: "create_note", title: item.title.trim(), content: item.content.trim() })
      continue
    }

    if (
      item.type === "update_task" &&
      typeof item.taskId === "string" &&
      item.taskId.length > 0 &&
      item.taskId.length <= 1500 &&
      !item.taskId.includes("/") &&
      isRecord(item.updates)
    ) {
      const updates = item.updates
      const cleanUpdates: Extract<ChatAction, { type: "update_task" }>["updates"] = {}
      if (typeof updates.title === "string" && updates.title.trim().length > 0 && updates.title.length <= 200) {
        cleanUpdates.title = updates.title.trim()
      }
      if (typeof updates.project === "string" && updates.project.length <= 200) {
        cleanUpdates.project = updates.project.trim()
      }
      if (isPriority(updates.priority)) cleanUpdates.priority = updates.priority
      if (typeof updates.dueDate === "string" && updates.dueDate.length <= 20) {
        cleanUpdates.dueDate = updates.dueDate
      }
      if (isValidTags(updates.tags)) cleanUpdates.tags = updates.tags
      if (typeof updates.completed === "boolean") cleanUpdates.completed = updates.completed
      if (Object.keys(cleanUpdates).length === 0) return null

      actions.push({
        type: "update_task",
        taskId: item.taskId,
        taskTitle: "",
        updates: cleanUpdates,
      })
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
    const tasks = getUserCollection(userId, "tasks")
    const updates = actions.filter(
      (action): action is Extract<ChatAction, { type: "update_task" }> => action.type === "update_task",
    )
    const existingTasks = await Promise.all(updates.map((action) => tasks.doc(action.taskId).get()))
    if (existingTasks.some((task) => !task.exists)) {
      return Response.json({ error: "Sebagian tugas sudah tidak ditemukan. Muat ulang halaman lalu coba lagi." }, { status: 409 })
    }

    const firestore = getAdminFirestore()
    const batch = firestore.batch()
    const taskRef = getUserCollection(userId, "tasks")
    const noteRef = getUserCollection(userId, "notes")
    for (const action of actions) {
      if (action.type === "create_task") {
        batch.create(taskRef.doc(), { ...action, createdAt: Date.now() })
      } else if (action.type === "update_task") {
        batch.update(taskRef.doc(action.taskId), action.updates)
      } else {
        batch.create(noteRef.doc(), { title: action.title, content: action.content, updatedAt: Date.now() })
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
