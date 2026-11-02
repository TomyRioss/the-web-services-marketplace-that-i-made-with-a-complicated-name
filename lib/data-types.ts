export type Role = "CLIENTE" | "DEV" | "ADMIN" | "OWNER";
export type CommunicationPreference = "TALK_TO_ME" | "AUTONOMOUS";
export type OrderStatus = "PENDING" | "IN_PROGRESS" | "REVIEW" | "APPROVED" | "DONE" | "CANCELLED";

export type Profile = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string | null;
  phone: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicProfile = Omit<Profile, "passwordHash">;

export type Service = {
  id: string;
  title: string;
  description: string;
  priceArs: number;
  priceUsd: number;
  advancePaymentPercent: number;
  promotionActive: boolean;
  promotionPriceArs: number | null;
  deliveryDays: number;
  category: string;
  portfolioUrls: string[];
  references: { url: string; imageUrl?: string }[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  id: string;
  serviceId: string;
  isCustom?: boolean;
  clientId: string;
  message: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};
