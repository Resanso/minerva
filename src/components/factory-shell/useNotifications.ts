"use client";

import { useEffect, useMemo, useState } from "react";

export type NotificationSeverity = "critical" | "warning" | "info";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: NotificationSeverity;
  machineId?: string;
  read?: boolean;
}

function createClientId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `notif-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Self-contained copy of the notification feed logic (same source +
// ordering as the legacy TopBar) so the factory shell owns its data
// without touching existing components.
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await fetch("/notification-data.json", { cache: "no-store" });
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        if (!isMounted) return;
        const list = Array.isArray(json?.notifications) ? json.notifications : [];
        const parsed: NotificationItem[] = list
          .filter((item: unknown) => item && typeof item === "object")
          .map((item: Record<string, unknown>) => {
            const raw = item.severity;
            const severity: NotificationSeverity =
              raw === "critical" || raw === "warning" || raw === "info" ? raw : "info";
            return {
              id: String(item.id ?? createClientId()),
              title: String(item.title ?? "Notification"),
              message: String(item.message ?? "-"),
              timestamp: String(item.timestamp ?? new Date().toISOString()),
              machineId: typeof item.machineId === "string" ? item.machineId : undefined,
              severity,
              read: Boolean(item.read),
            } satisfies NotificationItem;
          });
        parsed.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setNotifications(parsed);
      } catch (err) {
        console.error("Failed to load notifications", err);
        if (isMounted) setNotifications([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markAllRead = () =>
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));

  const markRead = (id: string) =>
    setNotifications((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, read: true } : entry))
    );

  return { notifications, unreadCount, markAllRead, markRead };
}
