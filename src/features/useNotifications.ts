import useSWR from "swr";
import { api } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

export const useNotifications = () => useSWR<AppNotification[]>("/notifications", (p: string) => api<AppNotification[]>(p), { refreshInterval: 60_000 });

export const unreadCount = (list: AppNotification[] | undefined) => (list ?? []).filter((n) => !n.readAt).length;
