import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER" && session.role !== "ADMIN" && session.role !== "DEV") redirect("/marketplace");

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <AdminSidebar role={session.role} />
      <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
