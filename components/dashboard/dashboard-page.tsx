import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ProjectAnalytics } from "@/components/dashboard/project-analytics"
import { Reminders } from "@/components/dashboard/reminders"
import { ProjectList } from "@/components/dashboard/project-list"
import { ProjectProgress } from "@/components/dashboard/project-progress"

export function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex-1 p-3 md:p-4 lg:ml-64 lg:p-5">
        <Header
          title="Dashboard"
          description="Ringkasan tugas dan project akunmu."
        />

        <div className="mt-4 space-y-3 md:mt-5 md:space-y-4">
          <StatsCards />

          <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
            <div className="space-y-3 md:space-y-4 lg:col-span-2">
              <ProjectAnalytics />
              <ProjectList />
            </div>

            <div className="space-y-3 md:space-y-4">
              <Reminders />
              <ProjectProgress />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
