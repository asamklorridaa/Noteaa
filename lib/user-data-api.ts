import "server-only"
import { auth } from "@clerk/nextjs/server"
import { getAdminFirestore } from "@/lib/firebase-admin"

const allowedFields: Record<string, ReadonlySet<string>> = {
  tasks: new Set(["title", "project", "priority", "dueDate", "completed", "tags", "createdAt"]),
  projects: new Set(["name", "dueDate", "createdAt"]),
  events: new Set(["title", "date", "time", "createdAt"]),
  notes: new Set(["title", "content", "updatedAt"]),
  chatMessages: new Set(["role", "text", "createdAt"]),
  settings: new Set(["pushNotifications", "dailyLogReminder", "teamUpdates", "theme"]),
}

export function isAllowedCollection(name: string) {
  return Object.hasOwn(allowedFields, name)
}

export async function getAuthenticatedUserId() {
  const { userId } = await auth()
  return userId
}

export function validateDocumentData(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false

  const data = value as Record<string, unknown>
  const collectionName = data.__collection
  if (typeof collectionName !== "string" || !isAllowedCollection(collectionName)) return false

  delete data.__collection
  const fields = allowedFields[collectionName]
  return (
    Object.keys(data).length > 0 &&
    Object.keys(data).every((key) => fields.has(key)) &&
    new TextEncoder().encode(JSON.stringify(data)).length <= 100_000
  )
}

export function getUserCollection(userId: string, collectionName: string) {
  return getAdminFirestore().collection("users").doc(userId).collection(collectionName)
}
