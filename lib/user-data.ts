import type { UserDocument } from "@/hooks/use-user-collection"

export type TaskRecord = UserDocument & {
  title: string
  project: string
  priority: "High" | "Medium" | "Low"
  dueDate: string
  completed: boolean
  tags: string[]
  createdAt: number
}

export type ProjectRecord = UserDocument & {
  name: string
  dueDate: string
  createdAt: number
}

export type EventRecord = UserDocument & {
  title: string
  date: string
  time: string
  createdAt: number
}

export type NoteRecord = UserDocument & {
  title: string
  content: string
  updatedAt: number
}

export type ChatRecord = UserDocument & {
  role: "assistant" | "user"
  text: string
  createdAt: number
}

export type PreferencesRecord = UserDocument & {
  pushNotifications: boolean
  dailyLogReminder: boolean
  teamUpdates: boolean
  theme: "light" | "dark"
}
