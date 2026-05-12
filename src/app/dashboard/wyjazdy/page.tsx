"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Trophy,
  Tent,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPLN } from "@/lib/camp-signup-helpers";

interface Camp {
  id: string;
  name: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  category: string | null;
  description: string | null;
  cost: number;
  maxSpots: number | null;
  status: string;
  signupOpen?: boolean;
  signupDeadline?: string | null;
  priceAthleteBus?: number | null;
  priceAthleteOwn?: number | null;
  priceCompanionBus?: number | null;
  priceCompanionOwn?: number | null;
  _count?: { registrations: number };
}

interface ParentCallup {
  id: string;
  status: string;
  transportChoice: string;
  notes: string | null;
  respondedAt: string | null;
  tournament: {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string | null;
    category: string;
    description: string | null;
    transportFee: number | null;
    meetingTime: string | null;
    meetingLocation: string | null;
    parentDeadline: string | null;
  };
  player: {
    id: string;
    firstName: string;
    lastName: string;
    category: string;
  };
}

const TYPE_LABELS: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  CAMP: { label: "OBÓZ", emoji: "🏕️", bg: "bg-sky-100", text: "text-sky-800" },
  TRIP: { label: "WYJAZD", emoji: "🚌", bg: "bg-indigo-100", text: "text-indigo-800" },
  WORKSHOP: { label: "SZKOLENIE", emoji: "🎓", bg: "bg-purple-100", text: "text-purple-800" },
};

export default function WyjazdyListPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [callups, setCallups] = useState<ParentCallup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [campsRes, callupsRes] = await Promise.all([
        fetch("/api/camps"),
        fetch("/api/parent/callups"),
      ]);

      if (campsRes.ok) {
        const data: Camp[] = await campsRes.json();
        const now = new Date();
        const filtered = data
          .filter((c) => new Date(c.endDate) >= now)
          .sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        setCamps(filtered);
      }

      if (callupsRes.ok) {
        const data = await callupsRes.json();
        setCallups(data.callups ?? []);
      }
    } catch {
      toast.error("Błąd sieci");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchData();
  }, [authStatus, router, fetchData]);

  return (
    <div className="space-y-8 -mx-4 sm:-mx-6 -my-4 sm:-my-6 px-4 sm:px-6 py-4 sm:py-6 bg-ice min-h-screen">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-1">
          Wyjazdy
        </h1>
        <p className="text-sm text-slate-600">
          Powołania na turnieje i nadchodzące obozy klubowe SWH.
        </p>
      </div>

      {/* === POWOŁANIA NA TURNIEJE === */}
      {callups.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="icon-section icon-section-trophy">
              <Trophy className="h-4 w-4" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              Powołania na turnieje
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {callups.length}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {callups.map((cu) => (
              <CallupCard key={cu.id} callup={cu} />
            ))}
          </div>
        </section>
      )}

      {/* === OBOZY === */}
      {camps.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="icon-section icon-section-camp">
              <Tent className="h-4 w-4" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              Obozy i wyjazdy
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {camps.length}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {camps.map((camp) => (
              <CampCard key={camp.id} camp={camp} />
            ))}
          </div>
        </section>
      )}

      {/* === PUSTY STAN === */}
      {!loading && camps.length === 0 && callups.length === 0 && (
        <div className="card-rink rounded-2xl py-12 text-center">
          <Tent className="h-12 w-12 text-sky-300 mx-auto mb-4" />
          <p className="text-slate-600">
            Obecnie nie ma zaplanowanych wyjazdów ani powołań.
          </p>
        </div>
      )}

      {loading && (
        <p className="text-center text-slate-500 py-8">Ładowanie…</p>
      )}
    </div>
  );
}

// ===================== KARTA POWOŁANIA =====================
function CallupCard({ callup }: { callup: ParentCallup }) {
  const t = callup.tournament;
  const start = new Date(t.startDate);
  const deadline = t.parentDeadline ? new Date(t.parentDeadline) : null;
  const isPastDeadline = deadline ? new Date() > deadline : false;
  const responded = callup.status === "CONFIRMED" || callup.status === "DECLINED";

  const cardClass =
    callup.status === "CONFIRMED"
      ? "card-callup-confirmed"
      : callup.status === "DECLINED"
      ? "card-callup-declined"
      : "card-callup-pending";

  let statusBadge: React.ReactNode;
  if (callup.status === "CONFIRMED") {
    const label =
      callup.transportChoice === "BUS"
        ? "🚌 Autokar SWH"
        : callup.transportChoice === "OWN"
        ? "🚗 Własny transport"
        : "Potwierdzony";
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="h-3 w-3" /> JADĘ — {label.toUpperCase()}
      </span>
    );
  } else if (callup.status === "DECLINED") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
        <XCircle className="h-3 w-3" /> NIE JADĘ
      </span>
    );
  } else {
    statusBadge = (
      <span className="badge-pulse inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs">
        ⏰ WYMAGA ODPOWIEDZI
      </span>
    );
  }

  return (
    <div className={`${cardClass} rounded-2xl p-5 relative`}>
      <div className="flex items-start justify-between mb-3 gap-2">
        {statusBadge}
        <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
          {callup.player.category}
        </span>
      </div>

      <h3 className="font-display text-lg font-bold text-slate-900 leading-tight mb-1">
        {t.name}
      </h3>
      <p className="text-xs text-slate-600 mb-3">
        Powołany:{" "}
        <strong>
          {callup.player.firstName} {callup.player.lastName}
        </strong>
      </p>

      <div className="space-y-1.5 text-sm text-slate-700 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <span>
            <strong>
              {start.toLocaleDateString("pl-PL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <span>{t.location}</span>
        </div>
        {t.transportFee != null && t.transportFee > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <span>
              Opłata autokar: <strong>{formatPLN(t.transportFee)}</strong>
            </span>
          </div>
        )}
        {deadline && !responded && (
          <div className="flex items-center gap-2">
            <span className="text-base">⏰</span>
            <span
              className={isPastDeadline ? "text-red-700 font-semibold" : "text-amber-900 font-semibold"}
            >
              {isPastDeadline ? "Przekroczono termin: " : "Odpowiedz do: "}
              <strong>
                {deadline.toLocaleDateString("pl-PL", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                })}
                {" "}
                {deadline.toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </span>
          </div>
        )}
        {responded && (
          <div className="flex items-center gap-2 text-emerald-700">
            <span className="text-base">✓</span>
            <span className="font-semibold">Odpowiedź zapisana</span>
          </div>
        )}
      </div>

      <Link href={`/dashboard/wyjazdy/turniej/${callup.id}`}>
        <button
          className={
            responded
              ? "w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2"
              : "btn-ice-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          }
        >
          {responded ? "Zmień odpowiedź" : "Odpowiedz na powołanie"}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </Link>
    </div>
  );
}

// ===================== KARTA OBOZU =====================
function CampCard({ camp }: { camp: Camp }) {
  const typeInfo = TYPE_LABELS[camp.type] ?? TYPE_LABELS.CAMP;
  const deadline = camp.signupDeadline ? new Date(camp.signupDeadline) : null;
  const isPastDeadline = deadline ? new Date() > deadline : false;
  const isClosed = camp.signupOpen === false || isPastDeadline;
  const priceBus = camp.priceAthleteBus ?? camp.cost;
  const priceOwn = camp.priceAthleteOwn ?? camp.cost;
  const enrolled = camp._count?.registrations ?? 0;
  const free = camp.maxSpots ? camp.maxSpots - enrolled : null;

  return (
    <div className="card-rink rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3 gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${typeInfo.bg} ${typeInfo.text}`}
        >
          {typeInfo.emoji} {typeInfo.label}
          {isClosed ? (
            <span className="ml-1 opacity-70">· ZAMKNIĘTY</span>
          ) : (
            <span className="ml-1 opacity-90">· ZAPISY OTWARTE</span>
          )}
        </span>
        {camp.category && (
          <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {camp.category}
          </span>
        )}
      </div>

      <h3 className="font-display text-lg font-bold text-slate-900 leading-tight mb-1">
        {camp.name}
      </h3>
      <p className="text-xs text-slate-500 mb-3">{camp.location}</p>

      <div className="space-y-1.5 text-sm text-slate-700 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>
            <strong>
              {new Date(camp.startDate).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
              })}
              {" – "}
              {new Date(camp.endDate).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
              })}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-slate-500" />
          <span>
            {enrolled}
            {camp.maxSpots ? `/${camp.maxSpots}` : ""} zapisanych
            {free !== null && (
              <span className="text-emerald-600 font-medium ml-1">
                · {free} {free === 1 ? "wolne miejsce" : "wolnych miejsc"}
              </span>
            )}
          </span>
        </div>
        {priceBus > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <span>
              Zawodnik: <strong>{formatPLN(priceBus)}</strong>
              {priceOwn !== priceBus && priceOwn > 0 && (
                <>
                  {" "}
                  / <strong>{formatPLN(priceOwn)}</strong>
                </>
              )}
            </span>
          </div>
        )}
        {deadline && !isPastDeadline && (
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Zapisy do{" "}
              <strong>
                {deadline.toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "long",
                })}
              </strong>
            </span>
          </div>
        )}
      </div>

      <Link href={`/dashboard/wyjazdy/${camp.id}`}>
        <button
          className={
            isClosed
              ? "w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2"
              : "btn-ice-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          }
        >
          {isClosed ? "Zobacz szczegóły" : "Zapisz dziecko"}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </Link>
    </div>
  );
}
