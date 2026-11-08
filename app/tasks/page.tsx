import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { TasksContent } from "@/components/tasks/tasks-content"

export default function TasksPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header title="Tasks" description="Kelola tugas pada akunmu." />

        <div className="mt-6">
          <TasksContent />
        </div>
      </main>
    </div>
  )
}
