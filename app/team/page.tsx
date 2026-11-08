import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { TeamContent } from "@/components/team/team-content"

export default function TeamPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header title="Team" description="Kelola informasi tim." />

        <div className="mt-6">
          <TeamContent />
        </div>
      </main>
    </div>
  )
}
