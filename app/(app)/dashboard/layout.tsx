import { getSession } from "@/lib/auth/session";
import { getProfileById } from "@/lib/profiles";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "./DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getProfileById(session.userId);
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <DashboardSidebar role={profile.role} fullName={profile.fullName ?? profile.email} email={profile.email} />
      <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
