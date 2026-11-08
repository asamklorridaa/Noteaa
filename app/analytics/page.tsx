import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AnalyticsContent } from "@/components/analytics/analytics-content"

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header title="Analytics" description="Analisis berdasarkan data tugas dan project akunmu." />

        <div className="mt-6">
          <AnalyticsContent />
        </div>
      </main>
    </div>
  )
}
