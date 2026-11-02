# Order Assignment Clarity Implementation Plan

> **For agentic workers:** Use the native session to implement each task in order. Track progress with the checkboxes below.

**Goal:** Show clients whether a developer is assigned to each active order and make order chat available only after assignment.

**Architecture:** Extend the existing dashboard order model with the assigned developer's display name. Use one shared assignment status component in both order lists, and enforce the chat rule in the existing server authorization function so page loads, message actions, and realtime subscriptions share the same check.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript, PocketBase, Tailwind CSS, Playwright browser QA.

**Spec:** `docs/superpowers/specs/2026-11-02-order-assignment-clarity-design.md`

## Global Constraints

- Use the accent color `#C9E94F` and Michroma for headings and CTAs.
- Keep the existing operational order status separate from developer assignment status.
- Clients cannot read, send, or subscribe to an order chat before assignment.
- Preserve existing access for order managers and the assigned developer.
- Keep the empty active orders action to create a new order.

## Review Focus

- An unassigned pending or in-progress order must clearly say that a developer is being sought and must not offer chat.
- An assigned developer with no full name must display a usable fallback such as their email.
- A client opening a saved chat URL or realtime URL before assignment must be denied even if the UI hides the link.
- A reassigned order must show the current developer, not a stale developer name.
- Empty orders, mobile width, keyboard focus, and chat errors must remain understandable.

## Files

- `app/actions/dashboard.ts`: map expanded `assignedDev` data and enforce client chat authorization.
- `app/(app)/dashboard/OrderAssignmentStatus.tsx`: render the shared assigned or searching state.
- `app/(app)/dashboard/page.tsx`: place assignment state and conditional chat action in active orders.
- `app/(app)/dashboard/orders/page.tsx`: apply the same state and action in Mis pedidos.
- `app/(app)/dashboard/chats/page.tsx`: explain that order chats appear after assignment.
- `app/actions/marketplace.ts`: retain and confirm existing dashboard revalidation after assignment.
- `app/api/chat/realtime/route.ts`: relies on `getChatThread` authorization for order subscriptions; change only if QA reveals an uncovered path.

---

### Task 1: Enforce assignment before client chat access

**Files:**
- Modify: `app/actions/dashboard.ts`

**Interfaces:**
- `DashboardOrder` gains `assignedDevName: string`.
- `fetchOrders` expands `assignedDev`; `mapOrder` uses full name, then email, then an empty string.
- `getOrderOrFail` rejects a client when `assignedDevId` is empty. Existing owner, admin, and assigned developer access remains unchanged.
- `getChatList` omits unassigned order threads for clients while preserving direct chats.

- [x] Extend the PocketBase record type for `expand.assignedDev` and add `assignedDevName` to the mapped dashboard order.
- [x] Add `assignedDev` to the order list expansion and retain the email fallback when a name is missing.
- [x] Add the client assignment check to `getOrderOrFail`, keeping manager access and the existing DEV ownership check intact.
- [x] Review all callers: `getChatThread` gates route rendering and realtime authorization; `sendChatMessage` gates writes.
- [x] Filter unassigned order threads out of the client chat list while preserving direct chats.
- [x] Inspect the resulting diff and confirm no unrelated files or existing user changes are included.

**Review:** Attempt each client chat operation with an unassigned order, then verify assigned client, assigned developer, and manager access.

### Task 2: Explain assignment state in both order lists

**Files:**
- Create: `app/(app)/dashboard/OrderAssignmentStatus.tsx`
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `app/(app)/dashboard/orders/page.tsx`
- Modify: `app/(app)/dashboard/chats/page.tsx`

**Interfaces:**
- Component accepts `{ assignedDevId: string; assignedDevName: string; chatHref: string }` and renders either the searching state or developer name plus the chat action.
- Assignment is determined by `assignedDevId`, with a generic name fallback if the assigned profile has no display name.
- Both order pages pass the mapped order assignment data into the same component.

- [x] Build the shared state with explicit copy: unassigned orders say «Buscando desarrollador» and «Te avisaremos cuando alguien sea asignado»; assigned orders show the developer name, «Ya podés conversar sobre tu pedido» and «Abrir chat».
- [x] Use the existing card and token styles, lime accent for the enabled CTA, Michroma on CTA text, visible keyboard focus, and a layout that wraps on narrow screens.
- [x] Replace the unconditional chat link in Pedidos activos with the shared assignment state.
- [x] Replace the unconditional chat action in Mis pedidos with the shared assignment state.
- [x] Hide unassigned order chats from the client chat list while retaining direct chats; update the list explanation and empty state.
- [x] Preserve operational status badges, order details, and the empty-state create-order action.
- [x] Confirm the assignment action already revalidates `/dashboard` and `/dashboard/orders`; avoid unrelated changes if this remains true.

**Review:** Inspect assigned and unassigned cards at desktop and mobile widths; verify the disabled state is explanatory text with no chat link.

### Task 3: Verify the complete customer flow

**Files:**
- No new application files unless a concrete defect is found.
- QA evidence: temporary files under `dogfood-output/`, removed after QA.

- [x] Use the existing preview and test credentials from `QA-Accounts.md`.
- [ ] As a client, inspect an unassigned order on Pedidos activos and Mis pedidos; the test client has no orders, so this state could not be checked under the client role.
- [x] Direct access to an unassigned order URL was denied and its realtime request returned 403 for the test client; the order belongs to another client, so this does not verify the assignment-specific ownership case. Message action behavior was reviewed in code through the shared authorization check.
- [ ] Assign a developer using the existing admin flow, revisit both order lists, and confirm the developer name and chat action appear.
- [ ] Open chat and send a message as the client; confirm the assigned developer and manager can still access their permitted chats.
- [x] Check the empty client state and mobile width; there was no horizontal overflow. The expected denied realtime request logged one 403 network error and no JavaScript exception.
- [x] Record QA coverage and limitations, delete temporary screenshots, and retain only product assets.

**QA limitation:** The client account has no orders. The two active orders in the shared QA data are unassigned, and no assigned order exists, so the assigned UI branch and client-owned unassigned authorization case could not be exercised end to end. After the dev server restart, the owner dashboard also returned 500 because the configured PocketBase instance lacks `ttmcobuild_notifications`; a separate Pebble compaction log reported insufficient disk space.

---
