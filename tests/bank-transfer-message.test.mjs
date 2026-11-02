import assert from "node:assert/strict";
import test from "node:test";
import { buildBankTransferMessage } from "../lib/bank-transfer-message.ts";
import { getPendingTransfersToSupersede, isPaymentRequestVisible } from "../lib/order-payment-visibility.ts";

test("sends current ARS bank instructions and request amount to the chat", () => {
  const message = buildBankTransferMessage(75_000, "ARS");
  assert.match(message, /ARS\s?75\.000,00/);
  assert.match(message, /Titular: Tomas Alexander Rios/);
  assert.match(message, /Alias: tomyrios\.mp/);
  assert.match(message, /CVU: 0000003100068327389046/);
  assert.match(message, /comprobante como imagen en este chat/);
});

test("retains USD bank instructions and request amount in the chat", () => {
  const message = buildBankTransferMessage(50, "USD");
  assert.match(message, /USD\s?50,00/);
  assert.match(message, /Titular: Tomas Alexander Rios/);
  assert.match(message, /Banco: Lead Bank/);
  assert.match(message, /Cuenta: 211469172078/);
  assert.match(message, /Routing: 101019644/);
  assert.match(message, /Checking \(Corriente\)/);
});

test("V4 hides a cancelled transfer request from the payment panel", () => {
  assert.equal(isPaymentRequestVisible("EXPIRED"), false);
  assert.equal(isPaymentRequestVisible("REJECTED"), false);
  assert.equal(isPaymentRequestVisible("PENDING"), true);
  assert.equal(isPaymentRequestVisible("APPROVED"), true);
});

test("a new transfer request supersedes pending transfers only", () => {
  const requests = [
    { id: "old-bank", method: "BANK_TRANSFER", status: "PENDING" },
    { id: "current", method: "BANK_TRANSFER", status: "PENDING" },
    { id: "old-approved", method: "BANK_TRANSFER", status: "APPROVED" },
    { id: "other-pending", method: "BANK_TRANSFER", status: "PENDING" },
  ];
  assert.deepEqual(getPendingTransfersToSupersede(requests, "current"), [requests[0]]);
});
