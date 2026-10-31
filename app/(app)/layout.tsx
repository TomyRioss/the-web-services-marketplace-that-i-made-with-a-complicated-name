import { getSession } from "@/lib/auth/session";
import { getProfileById } from "@/lib/profiles";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await getProfileById(session.userId);
  if (!profile) redirect("/login");

  return <AppShell profile={profile}>{children}</AppShell>;
}
