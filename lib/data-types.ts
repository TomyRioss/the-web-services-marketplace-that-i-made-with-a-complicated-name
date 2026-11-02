export type Role = "CLIENTE" | "DEV" | "ADMIN" | "OWNER";
export type OrderStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

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
