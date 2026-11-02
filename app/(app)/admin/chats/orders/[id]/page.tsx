import { notFound, redirect } from "next/navigation";
import { getChatThread } from "@/app/actions/dashboard";
import { ChatThread } from "@/app/(app)/dashboard/chats/ChatThread";
import { STATUS_META } from "@/app/(app)/dashboard/ui-helpers";
import { getSession } from "@/lib/auth/session";

export default async function AdminOrderChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.role === "DEV") redirect(`/dashboard/chats/${id}`);
  const thread = await getChatThread(id).catch(() => notFound());
  const status = STATUS_META[thread.order.status];
  return (
    <main className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[65vh] w-full max-w-5xl flex-1 flex-col">
        <ChatThread
          orderId={thread.order.id}
          orderTitle={thread.order.serviceTitle}
          statusLabel={status.label}
          statusClass={status.className}
          initialMessages={thread.messages}
          backHref="/admin/chats"
        />
      </div>
    </main>
  );
}
