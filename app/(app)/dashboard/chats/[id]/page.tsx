import { redirect } from "next/navigation";
import { getChatThread } from "@/app/actions/dashboard";
import { ChatThread } from "../ChatThread";
import { STATUS_META } from "../../ui-helpers";

export default async function OrderChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let thread: Awaited<ReturnType<typeof getChatThread>>;
  try {
    thread = await getChatThread(id);
  } catch {
    redirect("/dashboard/chats");
  }

  const meta = STATUS_META[thread.order.status];

  return (
    <main className="flex min-h-0 flex-1 flex-col px-4 py-8 sm:px-8 sm:py-10">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <ChatThread
          orderId={thread.order.id}
          orderTitle={thread.order.serviceTitle}
          statusLabel={meta.label}
          statusClass={meta.className}
          communicationPreference={thread.order.communicationPreference}
          sessionRole={thread.sessionRole}
          initialMessages={thread.messages}
          paymentPanel={{
            role: thread.sessionRole,
            orderStatus: thread.order.status,
            isCustom: thread.order.isCustom,
            servicePriceArs: thread.order.priceArs,
            servicePriceUsd: thread.order.priceUsd,
            advancePaymentPercent: thread.order.advancePaymentPercent,
            promotionActive: thread.order.promotionActive,
            promotionPriceArs: thread.order.promotionPriceArs,
            requests: thread.paymentRequests,
            requestsError: thread.paymentRequestsError,
          }}
          reviewPanel={thread.reviewPanel}
          closePanel={thread.closePanel}
          deliveryPanel={thread.deliveryPanel ? { role: thread.sessionRole, ...thread.deliveryPanel } : null}
        />
      </div>
    </main>
  );
}
