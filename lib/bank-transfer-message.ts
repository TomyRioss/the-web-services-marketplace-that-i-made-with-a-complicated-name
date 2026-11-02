import type { PaymentCurrency } from "@/lib/order-payments";

export function buildBankTransferMessage(amount: number, currency: PaymentCurrency) {
  const formattedAmount = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 20,
  }).format(amount);

  const bankDetails = currency === "ARS"
    ? ["Titular: Tomas Alexander Rios", "Alias: tomyrios.mp", "CVU: 0000003100068327389046"]
    : ["Titular: Tomas Alexander Rios", "Banco: Lead Bank", "Cuenta: 211469172078", "Routing: 101019644", "Tipo de cuenta: Checking (Corriente)"];

  return [
    `Solicitud de transferencia bancaria por ${formattedAmount}.`,
    "",
    "Datos para transferir:",
    ...bankDetails,
    "",
    "Cuando transfieras, adjunt\u00e1 el comprobante como imagen en este chat. El equipo confirmar\u00e1 la recepci\u00f3n.",
  ].join("\n");
}
