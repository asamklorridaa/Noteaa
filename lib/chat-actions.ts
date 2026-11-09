export type ChatAction =
  | {
      type: "create_task"
      title: string
      project: string
      priority: "High" | "Medium" | "Low"
      dueDate: string
      tags: string[]
    }
  | {
      type: "update_task"
      taskId: string
      taskTitle: string
      updates: {
        title?: string
        project?: string
        priority?: "High" | "Medium" | "Low"
        dueDate?: string
        tags?: string[]
        completed?: boolean
      }
    }
  | { type: "delete_task"; taskId: string; taskTitle: string }
  | { type: "create_project"; name: string; dueDate: string }
  | {
      type: "update_project"
      projectId: string
      projectName: string
      updates: { name?: string; dueDate?: string }
    }
  | { type: "delete_project"; projectId: string; projectName: string }
  | { type: "create_event"; title: string; date: string; time: string }
  | {
      type: "update_event"
      eventId: string
      eventTitle: string
      updates: { title?: string; date?: string; time?: string }
    }
  | { type: "delete_event"; eventId: string; eventTitle: string }
  | { type: "create_note"; title: string; content: string }
  | {
      type: "update_note"
      noteId: string
      noteTitle: string
      updates: { title?: string; content?: string }
    }
  | { type: "delete_note"; noteId: string; noteTitle: string }
