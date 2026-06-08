"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function PushNotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function loadNotifications() {
    try {
      const res = await fetch("/api/client/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch("/api/client/notifications/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
  }

  if (notifications.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="relative bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl px-4 py-3 sm:px-5 sm:py-4 shadow-lg shadow-blue-500/20"
        >
          <button
            type="button"
            onClick={() => dismiss(n.id)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-sm font-bold"
            aria-label="Dismiss"
          >
            ×
          </button>
          <p className="font-bold text-sm sm:text-base pr-8">{n.title}</p>
          <p className="text-sm text-blue-100 mt-1 pr-4 leading-relaxed">{n.message}</p>
          <p className="text-[10px] text-blue-200/80 mt-2">{formatDateTime(n.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}
