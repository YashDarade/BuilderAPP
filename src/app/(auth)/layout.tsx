export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/icon-192.png" alt="BuildTrack" className="h-12 w-12 rounded-xl" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">BuildTrack</h1>
            <p className="text-sm text-muted-foreground">
              Construction Project Management
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
