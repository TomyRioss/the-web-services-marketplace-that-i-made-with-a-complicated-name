export function normalizePhone(phone: string | null | undefined) {
  return phone?.replace(/\D/g, "") ?? "";
}

export function isValidPhoneNumber(phone: string | null | undefined) {
  const digits = normalizePhone(phone);
  return digits.length >= 8 && digits.length <= 15;
}
