"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Tent,
  Dumbbell,
  BookOpen,
  Download,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

type SwhCategory = "MIKRUS" | "MINI_HOKEJ" | "MLODZIK" | "JUNIOR";

interface CalendarSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  group: {
    id: string;
    name: string;
    category: string;
    swhCategory?: string;
  };
}

interface CalendarTournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string | null;
  category: string;
  swhCategory?: string;
  status: string;
  group: { id: string; name: string } | null;
  _count: { callups: number; matches: number };
}

interface CalendarCamp {
  id: string;
  name: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  category?: string;
  swhCategory?: string;
  group: { id: string; name: string } | null;
}

interface CalendarSession {
  id: string;
  title: string;
  topic?: string | null;
  date: string;
  duration: number;
  plan: {
    id: string;
    name: string;
    category: string;
    swhCategory?: string;
    groupId?: string;
  };
}

interface CalendarData {
  schedules: CalendarSchedule[];
  tournaments: CalendarTournament[];
  camps: CalendarCamp[];
  sessions: CalendarSession[];
}

interface DayEvent {
  type: "training" | "tournament" | "camp" | "session";
  swhGroup: SwhCategory;
  title: string;
  subtitle?: string;
  time?: string;
  location?: string;
  href?: string;
  raw: CalendarSchedule | CalendarTournament | CalendarCamp | CalendarSession;
}

// ============================================================
// CONSTANTS
// ============================================================

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const WEEKDAY_NAMES_LONG = [
  "Niedziela", "Poniedziałek", "Wtorek", "Środa",
  "Czwartek", "Piątek", "Sobota",
];

const GROUP_ORDER: SwhCategory[] = ["MIKRUS", "MINI_HOKEJ", "MLODZIK", "JUNIOR"];

const GROUP_LABELS: Record<SwhCategory, string> = {
  MIKRUS: "Mikrus",
  MINI_HOKEJ: "Mini Hokej",
  MLODZIK: "Młodzik",
  JUNIOR: "Junior",
};

const GROUP_STYLES: Record<
  SwhCategory,
  { dot: string; bg: string; text: string; chipBg: string; chipText: string; border: string }
> = {
  MIKRUS: {
    dot: "bg-amber-500",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-900 dark:text-amber-200",
    chipBg: "bg-amber-50 dark:bg-amber-950/50",
    chipText: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-800",
  },
  MINI_HOKEJ: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-900 dark:text-emerald-200",
    chipBg: "bg-emerald-50 dark:bg-emerald-950/50",
    chipText: "text-emerald-800 dark:text-emerald-200",
    border: "border-emerald-300 dark:border-emerald-800",
  },
  MLODZIK: {
    dot: "bg-sky-500",
    bg: "bg-sky-100 dark:bg-sky-950/40",
    text: "text-sky-900 dark:text-sky-200",
    chipBg: "bg-sky-50 dark:bg-sky-950/50",
    chipText: "text-sky-800 dark:text-sky-200",
    border: "border-sky-300 dark:border-sky-800",
  },
  JUNIOR: {
    dot: "bg-violet-500",
    bg: "bg-violet-100 dark:bg-violet-950/40",
    text: "text-violet-900 dark:text-violet-200",
    chipBg: "bg-violet-50 dark:bg-violet-950/50",
    chipText: "text-violet-800 dark:text-violet-200",
    border: "border-violet-300 dark:border-violet-800",
  },
};

// ============================================================
// HELPERS
// ============================================================

function toSwhCategory(item: {
  swhCategory?: string | null;
  category?: string | null;
}): SwhCategory {
  if (item.swhCategory && GROUP_ORDER.includes(item.swhCategory as SwhCategory)) {
    return item.swhCategory as SwhCategory;
  }
  const c = item.category;
  if (c === "U8") return "MIKRUS";
  if (c === "U10" || c === "U12") return "MINI_HOKEJ";
  if (c === "U14" || c === "U16") return "MLODZIK";
  if (c === "U18" || c === "SENIOR") return "JUNIOR";
  return "MINI_HOKEJ";
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function sameYMD(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ============================================================
// ICS EXPORT
// ============================================================

function toICSDate(iso: string, allDay = false): string {
  const d = new Date(iso);
  if (allDay) {
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  }
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T` +
    `${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

function icsEscape(s: string): string {
  return s.replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n");
}

function buildICS(data: CalendarData): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SWH Manager//Kalendarz//PL",
    "CALSCALE:GREGORIAN",
  ];

  data.tournaments.forEach((t) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:tournament-${t.id}@swh-manager`);
    lines.push(`DTSTART:${toICSDate(t.startDate)}`);
    lines.push(`DTEND:${toICSDate(t.endDate || t.startDate)}`);
    lines.push(`SUMMARY:${icsEscape(`🏆 ${t.name}`)}`);
    if (t.location) lines.push(`LOCATION:${icsEscape(t.location)}`);
    lines.push(`DESCRIPTION:${icsEscape(`Turniej · ${GROUP_LABELS[toSwhCategory(t)]}`)}`);
    lines.push("END:VEVENT");
  });

  data.camps.forEach((c) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:camp-${c.id}@swh-manager`);
    lines.push(`DTSTART;VALUE=DATE:${toICSDate(c.startDate, true)}`);
    lines.push(`DTEND;VALUE=DATE:${toICSDate(c.endDate, true)}`);
    lines.push(`SUMMARY:${icsEscape(`⛺ ${c.name}`)}`);
    if (c.location) lines.push(`LOCATION:${icsEscape(c.location)}`);
    lines.push("END:VEVENT");
  });

  data.sessions.forEach((s) => {
    const start = new Date(s.date);
    const end = new Date(start.getTime() + (s.duration || 60) * 60_000);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:session-${s.id}@swh-manager`);
    lines.push(`DTSTART:${toICSDate(start.toISOString())}`);
    lines.push(`DTEND:${toICSDate(end.toISOString())}`);
    const label = GROUP_LABELS[toSwhCategory(s.plan)];
    const summary = s.topic ? `${label}: ${s.topic}` : `${label}: ${s.title}`;
    lines.push(`SUMMARY:${icsEscape(summary)}`);
    if (s.plan?.name) lines.push(`DESCRIPTION:${icsEscape(`Plan: ${s.plan.name}`)}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CalendarPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();

  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [groupFilters, setGroupFilters] = useState<Set<SwhCategory>>(
    new Set<SwhCategory>(GROUP_ORDER)
  );

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar");
      if (res.ok) setData(await res.json());
      else toast.error("Nie udało się pobrać kalendarza");
    } catch {
      toast.error("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchData();
  }, [authStatus, router, fetchData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }
  function goToToday() {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  }

  // Siatka kalendarza ----------------------------------------
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  // Eventy dla danego dnia -----------------------------------
  function getEventsForDay(day: number): DayEvent[] {
    if (!data) return [];
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const events: DayEvent[] = [];

    if (typeFilter === "ALL" || typeFilter === "training") {
      data.schedules
        .filter((s) => s.dayOfWeek === dayOfWeek)
        .forEach((s) => {
          const grp = toSwhCategory(s.group);
          if (!groupFilters.has(grp)) return;
          events.push({
            type: "training",
            swhGroup: grp,
            title: s.group.name,
            time: `${s.startTime}–${s.endTime}`,
            location: s.location,
            href: `/dashboard/dziennik-pzsw?group=${s.group.id}`,
            raw: s,
          });
        });
    }

    if (typeFilter === "ALL" || typeFilter === "session") {
      data.sessions
        .filter((s) => {
          const d = new Date(s.date);
          return sameYMD(d, date);
        })
        .forEach((s) => {
          const grp = toSwhCategory(s.plan);
          if (!groupFilters.has(grp)) return;
          const topic = s.topic || s.title;
          events.push({
            type: "session",
            swhGroup: grp,
            title: topic,
            subtitle: s.plan?.name,
            time: new Date(s.date).toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            href: s.plan.groupId
              ? `/dashboard/dziennik-pzsw?group=${s.plan.groupId}&session=${s.id}`
              : `/dashboard/dziennik-pzsw?session=${s.id}`,
            raw: s,
          });
        });
    }

    if (typeFilter === "ALL" || typeFilter === "tournament") {
      data.tournaments
        .filter((t) => {
          const start = new Date(t.startDate);
          const end = t.endDate ? new Date(t.endDate) : start;
          return (
            date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
            date <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
          );
        })
        .forEach((t) => {
          const grp = toSwhCategory(t);
          if (!groupFilters.has(grp)) return;
          events.push({
            type: "tournament",
            swhGroup: grp,
            title: t.name,
            location: t.location,
            href: `/dashboard/turnieje/${t.id}`,
            raw: t,
          });
        });
    }

    if (typeFilter === "ALL" || typeFilter === "camp") {
      data.camps
        .filter((c) => {
          const start = new Date(c.startDate);
          const end = new Date(c.endDate);
          return (
            date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
            date <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
          );
        })
        .forEach((c) => {
          const grp = toSwhCategory(c);
          if (c.category || c.swhCategory) {
            if (!groupFilters.has(grp)) return;
          }
          events.push({
            type: "camp",
            swhGroup: grp,
            title: c.name,
            location: c.location,
            href: `/dashboard/wyjazdy/${c.id}`,
            raw: c,
          });
        });
    }

    return events;
  }

  const selectedDayEvents = useMemo(
    () => (selectedDay ? getEventsForDay(selectedDay.getDate()) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDay, data, typeFilter, groupFilters, currentDate]
  );

  const today = new Date();
  const isToday = (day: number) => sameYMD(new Date(year, month, day), today);
  const isSelected = (day: number) =>
    selectedDay && sameYMD(new Date(year, month, day), selectedDay);

  function toggleGroup(grp: SwhCategory) {
    setGroupFilters((prev) => {
      const next = new Set(prev);
      if (next.has(grp)) next.delete(grp);
      else next.add(grp);
      if (next.size === 0) GROUP_ORDER.forEach((g) => next.add(g));
      return next;
    });
  }

  function handleExportICS() {
    if (!data) return;
    const content = buildICS(data);
    const filename = `swh-kalendarz-${year}-${pad2(month + 1)}.ics`;
    downloadFile(filename, content, "text/calendar;charset=utf-8");
    toast.success("Pobrano plik kalendarza");
  }

  function iconForType(t: DayEvent["type"]) {
    switch (t) {
      case "training":
        return <Dumbbell className="h-3.5 w-3.5 shrink-0" />;
      case "session":
        return <BookOpen className="h-3.5 w-3.5 shrink-0" />;
      case "tournament":
        return <Trophy className="h-3.5 w-3.5 shrink-0" />;
      case "camp":
        return <Tent className="h-3.5 w-3.5 shrink-0" />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Kalendarz</h1>
        <div className="flex gap-2 items-center">
          <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie typy</SelectItem>
              <SelectItem value="training">Treningi cykliczne</SelectItem>
              <SelectItem value="session">Konspekty</SelectItem>
              <SelectItem value="tournament">Turnieje</SelectItem>
              <SelectItem value="camp">Obozy / wyjazdy</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportICS} disabled={!data}>
            <Download className="h-4 w-4 mr-1" />
            Eksport ICS
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-muted-foreground mr-1">Grupy:</span>
        {GROUP_ORDER.map((grp) => {
          const styles = GROUP_STYLES[grp];
          const active = groupFilters.has(grp);
          return (
            <button
              key={grp}
              onClick={() => toggleGroup(grp)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                active
                  ? cn(styles.chipBg, styles.chipText, styles.border)
                  : "bg-transparent text-muted-foreground border-border opacity-50 hover:opacity-100"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", styles.dot)} />
              {GROUP_LABELS[grp]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Poprzedni miesiąc">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {MONTH_NAMES[month]} {year}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
            Dziś
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Następny miesiąc">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-muted/50">
              {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"].map((d) => (
                <div key={d} className="text-center text-xs font-medium py-2 border-b">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const events = day ? getEventsForDay(day) : [];
                const todayCell = day && isToday(day);
                const selectedCell = day && isSelected(day);

                return (
                  <button
                    key={i}
                    onClick={() => day && setSelectedDay(new Date(year, month, day))}
                    disabled={!day}
                    className={cn(
                      "min-h-[80px] md:min-h-[100px] border-b border-r p-1 text-left transition-colors",
                      !day && "bg-muted/20 cursor-default",
                      day && "hover:bg-accent/40 cursor-pointer",
                      todayCell && "bg-sky-50/70 dark:bg-sky-950/20",
                      selectedCell && "ring-2 ring-inset ring-primary"
                    )}
                  >
                    {day && (
                      <>
                        <p
                          className={cn(
                            "text-xs font-medium mb-1",
                            todayCell && "text-sky-600 font-bold"
                          )}
                        >
                          {day}
                        </p>
                        <div className="space-y-0.5">
                          {events.slice(0, 3).map((ev, j) => {
                            const styles = GROUP_STYLES[ev.swhGroup];
                            return (
                              <div
                                key={j}
                                className={cn(
                                  "flex items-center gap-1 text-[10px] px-1 py-0.5 rounded truncate",
                                  styles.bg,
                                  styles.text
                                )}
                                title={`${ev.title}${ev.time ? ` (${ev.time})` : ""}${ev.location ? ` — ${ev.location}` : ""}`}
                              >
                                {iconForType(ev.type)}
                                <span className="truncate">{ev.title}</span>
                              </div>
                            );
                          })}
                          {events.length > 3 && (
                            <p className="text-[9px] text-muted-foreground px-1">
                              +{events.length - 3} więcej
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <DayDetailsPanel
            date={selectedDay}
            events={selectedDayEvents}
            iconForType={iconForType}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// PANEL SZCZEGÓŁÓW DNIA
// ============================================================

function DayDetailsPanel({
  date,
  events,
  iconForType,
}: {
  date: Date;
  events: DayEvent[];
  iconForType: (t: DayEvent["type"]) => React.ReactNode;
}) {
  const weekday = WEEKDAY_NAMES_LONG[date.getDay()];
  const dateLabel = `${weekday}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold">{dateLabel}</h3>
        <span className="text-xs text-muted-foreground">
          {events.length === 0
            ? "Brak wydarzeń"
            : `${events.length} ${events.length === 1 ? "wydarzenie" : events.length < 5 ? "wydarzenia" : "wydarzeń"}`}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
          Nic nie zaplanowano na ten dzień.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev, i) => {
            const styles = GROUP_STYLES[ev.swhGroup];
            const typeLabel =
              ev.type === "training"
                ? "Trening"
                : ev.type === "session"
                ? "Konspekt"
                : ev.type === "tournament"
                ? "Turniej"
                : "Obóz / wyjazd";

            const content = (
              <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-3 items-center p-3">
                <div className="text-sm text-muted-foreground">
                  {ev.time || (
                    <span className="text-xs text-muted-foreground/70">cały dzień</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full",
                        styles.chipBg,
                        styles.chipText
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
                      {GROUP_LABELS[ev.swhGroup]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      {iconForType(ev.type)}
                      {typeLabel}
                    </span>
                    {ev.location && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {ev.location}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{ev.title}</p>
                  {ev.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{ev.subtitle}</p>
                  )}
                </div>
                {ev.href && (
                  <div className="text-xs text-primary inline-flex items-center gap-1 whitespace-nowrap">
                    {ev.type === "session" || ev.type === "training"
                      ? "Konspekt"
                      : "Otwórz"}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            );

            const cardClass = cn(
              "border rounded-lg transition-colors",
              ev.href && "hover:bg-accent/40 hover:border-foreground/20"
            );

            return ev.href ? (
              <Link key={i} href={ev.href} className={cardClass}>
                {content}
              </Link>
            ) : (
              <div key={i} className={cardClass}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
