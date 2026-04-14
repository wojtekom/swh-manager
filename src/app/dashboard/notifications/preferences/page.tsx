"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Mail,
  Bell,
  MessageSquare,
  Smartphone,
  Save,
  ArrowLeft,
  Info,
} from "lucide-react";

interface Preference {
  type: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  TRAINING_REMINDER: "Przypomnienie o treningu",
  SCHEDULE_CHANGE: "Zmiana harmonogramu",
  SCHEDULE_CANCEL: "Odwołanie treningu",
  TOURNAMENT_UPDATE: "Aktualizacja turnieju",
  NEW_ANNOUNCEMENT: "Nowe ogłoszenie",
  NEW_MESSAGE: "Nowa wiadomość",
  CAMP_UPDATE: "Aktualizacja obozu",
  PAYMENT_REMINDER: "Przypomnienie o płatności",
  CALLUP: "Powołanie na turniej",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  TRAINING_REMINDER: "24h przed zaplanowanym treningiem",
  SCHEDULE_CHANGE: "Gdy zmienią się szczegóły treningu (godzina, lokalizacja)",
  SCHEDULE_CANCEL: "Gdy trening zostanie odwołany",
  TOURNAMENT_UPDATE: "Aktualizacje dotyczące turniejów HLH",
  NEW_ANNOUNCEMENT: "Ogłoszenia od trenera lub administracji",
  NEW_MESSAGE: "Nowe wiadomości prywatne i grupowe",
  CAMP_UPDATE: "Informacje o obozach sportowych",
  PAYMENT_REMINDER: "Przypomnienia o zaległych płatnościach",
  CALLUP: "Powołanie zawodnika na turniej",
};

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch("/api/notifications/preferences");
      const data = await res.json();
      setPreferences(data.preferences || []);
    } catch {
      // Set defaults
      setPreferences(
        Object.keys(TYPE_LABELS).map((type) => ({
          type,
          email: true,
          push: true,
          sms: false,
          inApp: true,
        }))
      );
    }
    setLoading(false);
  }

  function togglePref(
    type: string,
    channel: "email" | "push" | "sms" | "inApp"
  ) {
    setPreferences((prev) =>
      prev.map((p) => (p.type === type ? { ...p, [channel]: !p[channel] } : p))
    );
    setSaved(false);
  }

  async function savePreferences() {
    setSaving(true);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <a
            href="/dashboard/notifications"
            className="mb-2 inline-flex items-center gap-1 text-sm text-sky-600 hover:underline dark:text-sky-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Powiadomienia
          </a>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
            <Settings className="h-7 w-7 text-sky-500" />
            Ustawienia powiadomień
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Wybierz jak chcesz otrzymywać powiadomienia
          </p>
        </div>
        <button
          onClick={savePreferences}
          disabled={saving}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-all ${
            saved
              ? "bg-emerald-500"
              : "bg-sky-500 hover:bg-sky-600 active:scale-95"
          } disabled:opacity-50`}
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : saved ? (
            <>
              <Save className="h-4 w-4" />
              Zapisano!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Zapisz
            </>
          )}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
        <Info className="h-5 w-5 shrink-0 text-sky-500" />
        <div className="text-sm text-sky-700 dark:text-sky-300">
          <p className="font-medium">Tryb demo</p>
          <p className="mt-0.5 text-sky-600 dark:text-sky-400">
            Zewnętrzne powiadomienia (email, SMS, push) wymagają konfiguracji na
            serwerze VPS. W trybie demo widoczne są tylko powiadomienia w
            aplikacji.
          </p>
        </div>
      </div>

      {/* Channel legend */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: Bell,
            label: "W aplikacji",
            desc: "Dzwonek w aplikacji",
            color: "sky",
          },
          {
            icon: Mail,
            label: "Email",
            desc: "Na adres email",
            color: "emerald",
          },
          {
            icon: Smartphone,
            label: "Push",
            desc: "Na telefon/przeglądarkę",
            color: "violet",
          },
          {
            icon: MessageSquare,
            label: "SMS",
            desc: "Na numer telefonu",
            color: "amber",
          },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl bg-white p-3 dark:bg-slate-800"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}
            >
              <Icon className={`h-4 w-4 text-${color}-500`} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {label}
              </p>
              <p className="text-[10px] text-slate-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Preferences table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6">
          <span>Typ powiadomienia</span>
          <span className="w-16 text-center">
            <Bell className="mx-auto h-4 w-4" />
          </span>
          <span className="w-16 text-center">
            <Mail className="mx-auto h-4 w-4" />
          </span>
          <span className="w-16 text-center">
            <Smartphone className="mx-auto h-4 w-4" />
          </span>
          <span className="w-16 text-center">
            <MessageSquare className="mx-auto h-4 w-4" />
          </span>
        </div>

        {/* Rows */}
        {preferences.map((pref, idx) => (
          <div
            key={pref.type}
            className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 sm:px-6 ${
              idx < preferences.length - 1
                ? "border-b border-slate-100 dark:border-slate-700/50"
                : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {TYPE_LABELS[pref.type] || pref.type}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {TYPE_DESCRIPTIONS[pref.type] || ""}
              </p>
            </div>

            {(["inApp", "email", "push", "sms"] as const).map((channel) => (
              <div key={channel} className="flex w-16 justify-center">
                <button
                  onClick={() => togglePref(pref.type, channel)}
                  className={`h-6 w-11 rounded-full transition-colors ${
                    pref[channel]
                      ? "bg-sky-500"
                      : "bg-slate-200 dark:bg-slate-600"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      pref[channel] ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
