import { getMyNotifications } from "@/app/actions/notifications";
import { NotificationList } from "@/components/NotificationList";

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <main className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-none">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Notificaciones</h1>
        <NotificationList initialNotifications={notifications} />
      </div>
    </main>
  );
}
