export type NotificationType = "ASSIGNMENT" | "MESSAGE" | "STATUS";

export type DashboardNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
};
