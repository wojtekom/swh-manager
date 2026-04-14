"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Calendar,
  MessageSquare,
  Trophy,
  Megaphone,
  AlertTriangle,
  Tent,
  CreditCard,
  Users,
  X,
  Check,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  TRAINING_REMINDER: Calendar,
  SCHEDULE_CHANGE: AlertTriangle,
  SCHEDULE_CANCEL: AlertTriangle,
  TOURNAMENT_UPDATE: Trophy,
  NEW_ANNOUNCEMENT: Megaphone,
  NEW_MESSAGE: MessageSquare,
  CAMP_UPDATE: Tent,
  PAYMENT_REMINDER: CreditCard,
  CALLUP: Users,
};

const TYPE_COLORS: Record<string, string> = {
  TRAINING_REMINDER: "text-sky-500",
  SCHEDULE_CHANGE: "text-amber-500",
  SCHEDULE_CANCEL: "text-red-500",
  TOURNAMENT_UPDATE: "text-violet-500",
  NEW_ANNOUNCEMENT: "text-emerald-500",
  NEW_MESSAGE: "text-blue-500",
  CAMP_UPDATE: "text-teal-500",
  PAYMENT_REMINDER: "text-orange-500",
  CALLUP: "text-indigo-500",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "teraz";
  if (minutes < 60) return `${minutes} min temu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "wczoraj";
  return `${days} dni temu`;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Poll unread count every 30s
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Load notifications when dropdown opens
  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications?limit=10");
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch {
        // ignore
      }
      setLoading(false);
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  // Mark single as read + navigate
  const handleClick = async (notification: Notification) => {
    if (!notification.readAt) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "PATCH",
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative rounded-xl p-2 transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/30"
        title="Powiadomienia"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Powiadomienia
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30"
                  >
                    <Check className="h-3 w-3" />
                    Przeczytaj wszystkie
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Brak powiadomień
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Bell;
                  const color = TYPE_COLORS[n.type] || "text-slate-500";
                  const isUnread = !n.readAt;

                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/50 ${
                        isUnread ? "bg-sky-50/50 dark:bg-sky-900/10" : ""
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isUnread
                            ? "bg-sky-100 dark:bg-sky-900/30"
                            : "bg-slate-100 dark:bg-slate-700"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${
                              isUnread
                                ? "font-semibold text-slate-800 dark:text-slate-200"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {n.title}
                          </p>
                          {isUnread && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-2 dark:border-slate-700">
              <a
                href="/dashboard/notifications"
                className="block rounded-xl py-2 text-center text-sm font-medium text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30"
                onClick={() => setIsOpen(false)}
              >
                Zobacz wszystkie powiadomienia
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
