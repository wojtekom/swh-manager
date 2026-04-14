"use client";

import { useState, useEffect } from "react";
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
  Check,
  Settings,
  Filter,
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
  TRAINING_REMINDER: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  SCHEDULE_CHANGE: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  SCHEDULE_CANCEL: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  TOURNAMENT_UPDATE: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  NEW_ANNOUNCEMENT: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  NEW_MESSAGE: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  CAMP_UPDATE: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  PAYMENT_REMINDER: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  CALLUP: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const TYPE_LABELS: Record<string, string> = {
  TRAINING_REMINDER: "Trening",
  SCHEDULE_CHANGE: "Zmiana",
  SCHEDULE_CANCEL: "Odwołanie",
  TOURNAMENT_UPDATE: "Turniej",
  NEW_ANNOUNCEMENT: "Ogłoszenie",
  NEW_MESSAGE: "Wiadomość",
  CAMP_UPDATE: "Obóz",
  PAYMENT_REMINDER: "Płatność",
  CALLUP: "Powołanie",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Właśnie teraz";
  if (minutes < 60) return `${minutes} min temu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Wczoraj";
  if (days < 7) return `${days} dni temu`;
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const params = filter === "unread" ? "?unread=true" : "";
      const res = await fetch(`/api/notifications${params}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: n.readAt || new Date().toISOString(),
        }))
      );
    } catch {
      // ignore
    }
  }

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
    } catch {
      // ignore
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
            <Bell className="h-7 w-7 text-sky-500" />
            Powiadomienia
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-sm font-medium text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Twoje powiadomienia o treningach, turniejach i wiadomościach
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400"
            >
              <Check className="h-4 w-4" />
              Przeczytaj wszystkie
            </button>
          )}
          <a
            href="/dashboard/notifications/preferences"
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
          >
            <Settings className="h-4 w-4" />
            Ustawienia
          </a>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Wszystkie
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "unread"
              ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Filter className="mr-1 inline h-3.5 w-3.5" />
          Nieprzeczytane
        </button>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-500 border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800">
          <Bell className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-lg font-medium text-slate-400">
            {filter === "unread"
              ? "Brak nieprzeczytanych powiadomień"
              : "Brak powiadomień"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            const colors = TYPE_COLORS[n.type] || "bg-slate-100 text-slate-500";
            const label = TYPE_LABELS[n.type] || n.type;
            const isUnread = !n.readAt;

            return (
              <div
                key={n.id}
                className={`group flex gap-4 rounded-2xl border p-4 transition-all ${
                  isUnread
                    ? "border-sky-200 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-900/10"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${colors}`}
                      >
                        {label}
                      </span>
                      <h3
                        className={`mt-1 text-sm ${
                          isUnread
                            ? "font-semibold text-slate-800 dark:text-white"
                            : "font-medium text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {n.title}
                      </h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {formatDate(n.createdAt)}
                      </span>
                      {isUnread && (
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {n.body}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {n.link && (
                      <a
                        href={n.link}
                        className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                      >
                        Otwórz
                      </a>
                    )}
                    {isUnread && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        Oznacz jako przeczytane
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
