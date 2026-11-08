import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
            Noteaa
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-foreground">Selamat datang kembali</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masuk untuk melanjutkan ke dashboard Noteaa.</p>
        </div>
        <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
      </div>
    </main>
  )
}
