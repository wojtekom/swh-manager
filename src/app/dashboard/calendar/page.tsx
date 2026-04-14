"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Trophy,
  Tent,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CalendarData {
  schedules: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string;
    group: { id: string; name: string; category: string };
  }[];
  tournaments: {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string | null;
    category: string;
    status: string;
    group: { id: string; name: string } | null;
    _count: { callups: number; matches: number };
  }[];
  camps: {
    id: string;
    name: string;
    type: string;
    location: string;
    startDate: string;
    endDate: string;
    status: string;
    group: { id: string; name: string } | null;
  }[];
  sessions: {
    id: string;
    title: string;
    date: string;
    duration: number;
    plan: { id: string; name: string; category: string };
  }[];
}

interface DayEvent {
  type: "training" | "tournament" | "camp" | "session";
  title: string;
  time?: string;
  location?: string;
  category?: string;
  color: string;
}

const DAY_NAMES = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

export default function CalendarPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState("ALL");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar");
      if (res.ok) setData(await res.json());
    } catch {
      toast.error("Błąd");
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

  // Generuj siatkę kalendarza
  const firstDay = new Date(year, month, 1).getDay(); // 0=ndz
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay === 0 ? 6 : firstDay - 1; // shift do pon=0

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  function getEventsForDay(day: number): DayEvent[] {
    if (!data) return [];
    const events: DayEvent[] = [];
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    // Treningi (cykliczne)
    if (filterType === "ALL" || filterType === "training") {
      data.schedules
        .filter((s) => s.dayOfWeek === dayOfWeek)
        .forEach((s) => {
          events.push({
            type: "training",
            title: s.group.name,
            time: `${s.startTime}–${s.endTime}`,
            location: s.location,
            category: s.group.category,
            color: "bg-sky-500",
          });
        });
    }

    // Turnieje
    if (filterType === "ALL" || filterType === "tournament") {
      data.tournaments
        .filter((t) => {
          const start = new Date(t.startDate);
          const end = t.endDate ? new Date(t.endDate) : start;
          return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
                 date <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
        })
        .forEach((t) => {
          events.push({
            type: "tournament",
            title: t.name,
            location: t.location,
            category: t.category,
            color: "bg-amber-500",
          });
        });
    }

    // Obozy
    if (filterType === "ALL" || filterType === "camp") {
      data.camps
        .filter((c) => {
          const start = new Date(c.startDate);
          const end = new Date(c.endDate);
          return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
                 date <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
        })
        .forEach((c) => {
          events.push({
            type: "camp",
            title: c.name,
            location: c.location,
            color: "bg-emerald-500",
          });
        });
    }

    // Sesje szkoleniowe
    if (filterType === "ALL" || filterType === "session") {
      data.sessions
        .filter((s) => {
          const sDate = new Date(s.date);
          return sDate.getFullYear() === year && sDate.getMonth() === month && sDate.getDate() === day;
        })
        .forEach((s) => {
          events.push({
            type: "session",
            title: s.title,
            category: s.plan.category,
            color: "bg-violet-500",
          });
        });
    }

    return events;
  }

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Kalendarz</h1>
        <div className="flex gap-2 items-center">
          <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystko</SelectItem>
              <SelectItem value="training">Treningi</SelectItem>
              <SelectItem value="tournament">Turnieje</SelectItem>
              <SelectItem value="camp">Obozy</SelectItem>
              <SelectItem value="session">Sesje szkol.</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 flex-wrap text-xs">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Treningi</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Turnieje</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Obozy</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Sesje szkoleniowe</span>
      </div>

      {/* Nawigacja miesiąca */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Nagłówki dni */}
          <div className="grid grid-cols-7 bg-muted/50">
            {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"].map((d) => (
              <div key={d} className="text-center text-xs font-medium py-2 border-b">
                {d}
              </div>
            ))}
          </div>

          {/* Siatka */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const events = day ? getEventsForDay(day) : [];
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[80px] md:min-h-[100px] border-b border-r p-1",
                    !day && "bg-muted/20",
                    day && isToday(day) && "bg-sky-50/70 dark:bg-sky-950/20"
                  )}
                >
                  {day && (
                    <>
                      <p className={cn(
                        "text-xs font-medium mb-0.5",
                        isToday(day) && "text-sky-600 font-bold"
                      )}>
                        {day}
                      </p>
                      <div className="space-y-0.5">
                        {events.slice(0, 3).map((ev, j) => (
                          <div
                            key={j}
                            className={cn("text-[9px] md:text-[10px] text-white px-1 py-0.5 rounded truncate", ev.color)}
                            title={`${ev.title}${ev.time ? ` (${ev.time})` : ""}${ev.location ? ` — ${ev.location}` : ""}`}
                          >
                            {ev.title}
                            {ev.time && <span className="hidden md:inline ml-1 opacity-80">{ev.time}</span>}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <p className="text-[9px] text-muted-foreground">+{events.length - 3} więcej</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista wydarzeń bieżącego miesiąca */}
      {data && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Nadchodzące w tym miesiącu</h3>
          {data.tournaments
            .filter((t) => {
              const d = new Date(t.startDate);
              return d.getMonth() === month && d.getFullYear() === year;
            })
            .map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                <Trophy className="h-4 w-4 text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.startDate).toLocaleDateString("pl-PL")} · {t.location} · {t.category}</p>
                </div>
              </div>
            ))}
          {data.camps
            .filter((c) => {
              const d = new Date(c.startDate);
              return d.getMonth() === month && d.getFullYear() === year;
            })
            .map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                <Tent className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.startDate).toLocaleDateString("pl-PL")} – {new Date(c.endDate).toLocaleDateString("pl-PL")} · {c.location}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
