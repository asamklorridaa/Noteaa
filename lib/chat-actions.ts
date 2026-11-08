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
  | {
      type: "create_note"
      title: string
      content: string
    }
