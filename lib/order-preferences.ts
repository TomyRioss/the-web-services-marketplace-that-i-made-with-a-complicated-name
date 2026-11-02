import type { CommunicationPreference } from "@/lib/data-types";

export const COMMUNICATION_PREFERENCE_LABELS: Record<CommunicationPreference, string> = {
  TALK_TO_ME: "1. Quiero que me hablen",
  AUTONOMOUS: "2. Trabajo autónomo",
};

export function getCommunicationPreference(message: string): CommunicationPreference | null {
  const match = message.match(/(?:^|\n\n)Preferencia de comunicación: (Quiero que me hablen|Trabajo autónomo)(?:\n|$)/);
  if (!match) return null;
  return match[1] === "Quiero que me hablen" ? "TALK_TO_ME" : "AUTONOMOUS";
}
