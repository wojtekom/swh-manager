"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Calendar, ClipboardList, UserPlus, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";

interface Stats {
  players: number;
  paymentsOverdueCount: number;
  paymentsOverdueAmount: number;
  paymentsPaidAmount: number;
  recruitmentNew: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchStats();
  }, [status, router, fetchStats]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
          Ladowanie...
        </div>
      </div>
    );
  }

  if (!session) return null;

  const role = session.user.role;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 p-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Witaj, {session.user.name}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Panel {role === "ADMIN" ? "Administratora" : role === "COACH" ? "Trenera" : role === "PARENT" ? "Rodzica" : "Zawodnika"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(role === "ADMIN" || role === "COACH") && (
          <DashboardCard
            title="Zawodnicy"
            value={stats?.players?.toString() || "0"}
            description="Aktywni czlonkowie"
            icon={<Users className="h-5 w-5" />}
            color="sky"
          />
        )}
        {(role === "ADMIN" || role === "PARENT") && (
          <DashboardCard
            title="Do zaplaty"
            value={stats ? `${stats.paymentsOverdueAmount.toFixed(0)} zl` : "0 zl"}
            description={`${stats?.paymentsOverdueCount || 0} zaleglych platnosci`}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="amber"
          />
        )}
        {(role === "ADMIN") && (
          <DashboardCard
            title="Wplaty"
            value={stats ? `${stats.paymentsPaidAmount.toFixed(0)} zl` : "0 zl"}
            description="Suma oplaconych skladek"
            icon={<TrendingUp className="h-5 w-5" />}
            color="emerald"
          />
        )}
        {(role === "ADMIN" || role === "COACH") && (
          <DashboardCard
            title="Nowe zgloszenia"
            value={stats?.recruitmentNew?.toString() || "0"}
            description="Formularz naboru"
            icon={<UserPlus className="h-5 w-5" />}
            color="violet"
          />
        )}
      </div>

      {/* Quick actions */}
      <Card className="border-sky-100/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-sky-400" />
            Szybkie akcje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {role === "ADMIN" && (
            <>
              <p>1. <strong className="text-foreground">Zawodnicy</strong> — dodaj czlonkow klubu</p>
              <p>2. <strong className="text-foreground">Skladki</strong> — Definicje skladek — nalicz platnosci</p>
              <p>3. <strong className="text-foreground">Szkolenie</strong> — Importuj program SWH 2025/2026</p>
              <p>4. <strong className="text-foreground">Nabor</strong> — udostepnij formularz na stronie i social media</p>
              <p>5. Podlacz baze danych PostgreSQL w pliku <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env</code></p>
            </>
          )}
          {role === "COACH" && (
            <>
              <p>1. Sprawdz liste <strong className="text-foreground">Zawodnikow</strong></p>
              <p>2. Przegladaj <strong className="text-foreground">Szkolenie</strong> — plany treningowe i cwiczenia</p>
              <p>3. Przegladaj <strong className="text-foreground">Nabor</strong> — nowe zgloszenia</p>
            </>
          )}
          {role === "PARENT" && (
            <>
              <p>1. Sprawdz <strong className="text-foreground">Skladki</strong> — status platnosci</p>
              <p>2. Przegladaj <strong className="text-foreground">Harmonogram</strong> zajec</p>
              <p>3. Sprawdz <strong className="text-foreground">Kalendarz</strong> — turnieje i obozy</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const COLOR_MAP = {
  sky: {
    bg: "bg-sky-50",
    icon: "text-sky-500",
    iconBg: "bg-sky-100",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-500",
    iconBg: "bg-amber-100",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
    iconBg: "bg-emerald-100",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-500",
    iconBg: "bg-violet-100",
  },
} as const;

function DashboardCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <Card className={`${c.bg} border-transparent hover:shadow-md transition-shadow`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`rounded-xl ${c.iconBg} p-3 ${c.icon}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
