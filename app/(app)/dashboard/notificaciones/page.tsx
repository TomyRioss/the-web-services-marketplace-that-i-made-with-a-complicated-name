import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <main className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-none">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Notificaciones</h1>
        <div className="mt-8 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
          <Bell aria-hidden="true" className="size-6 text-accent-green" />
          <p className="mt-3 text-sm text-muted-foreground">Todavía no tenés notificaciones.</p>
        </div>
      </div>
    </main>
  );
}
