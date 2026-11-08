import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ProjectAnalytics } from "@/components/dashboard/project-analytics"
import { ProjectList } from "@/components/dashboard/project-list"
import { ProjectProgress } from "@/components/dashboard/project-progress"

export default function ProjectPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 p-4 lg:ml-64 lg:p-6">
        <Header title="Project" description="Pantau progres dan aktivitas project kamu." />
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ProjectList />
          <ProjectProgress />
          <ProjectAnalytics />
        </div>
      </main>
    </div>
  )
}
