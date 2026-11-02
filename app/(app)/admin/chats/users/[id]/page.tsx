import { notFound } from "next/navigation";
import { ChatThread } from "@/app/(app)/dashboard/chats/ChatThread";
import { getDirectChatThread } from "@/app/actions/team-chats";

export default async function AdminUserChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = await getDirectChatThread(id).catch(() => notFound());
  return (
    <main className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[65vh] w-full max-w-5xl flex-1 flex-col">
        <ChatThread
          directUserId={thread.contact.id}
          orderTitle={`${thread.contact.name} · ${thread.contact.role}`}
          statusLabel="Chat directo"
          statusClass="border-primary/30 text-primary"
          initialMessages={thread.messages}
          backHref="/admin/chats"
        />
      </div>
    </main>
  );
}
