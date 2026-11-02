import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AdminPage() {
  const session = await getSession();
  redirect(session?.role === "DEV" ? "/admin/chats" : "/admin/orders");
}
