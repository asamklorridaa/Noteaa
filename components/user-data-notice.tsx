import { Alert, AlertDescription } from "@/components/ui/alert"

export function UserDataNotice({
  loading,
  error,
  empty,
}: {
  loading: boolean
  error: string | null
  empty: string
}) {
  if (loading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Memuat data...</p>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
}
