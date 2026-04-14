"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Plus, Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Group {
  id: string;
  name: string;
  category: string;
}

interface Schedule {
  id: string;
  groupId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  recurring: boolean;
  group: { id: string; name: string; category: string };
}

const DAYS = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const DAYS_SHORT = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];

const DAY_COLORS: Record<number, string> = {
  0: "bg-red-50 border-red-200",
  1: "bg-blue-50 border-blue-200",
  2: "bg-green-50 border-green-200",
  3: "bg-yellow-50 border-yellow-200",
  4: "bg-purple-50 border-purple-200",
  5: "bg-orange-50 border-orange-200",
  6: "bg-pink-50 border-pink-200",
};

export default function SchedulePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const isAdminOrCoach = session?.user?.role === "ADMIN" || session?.user?.role === "COACH";

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [filterGroup, setFilterGroup] = useState("ALL");

  const fetchData = useCallback(async () => {
    try {
      const [sRes, gRes] = await Promise.all([
        fetch("/api/schedules"),
        fetch("/api/groups"),
      ]);
      if (sRes.ok) setSchedules(await sRes.json());
      if (gRes.ok) {
        const data = await gRes.json();
        setGroups(data.map((g: Group) => ({ id: g.id, name: g.name, category: g.category })));
      }
    } catch {
      toast.error("Błąd pobierania danych");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchData();
  }, [authStatus, router, fetchData]);

  const filtered = schedules.filter(
    (s) => filterGroup === "ALL" || s.groupId === filterGroup
  );

  // Group by day of week
  const byDay = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    items: filtered.filter((s) => s.dayOfWeek === i).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((d) => d.items.length > 0);

  async function handleDelete(id: string) {
    if (!confirm("Usunąć ten termin?")) return;
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Usunięto");
      fetchData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Harmonogram zajęć</h1>
          <p className="text-muted-foreground">{schedules.length} zaplanowanych zajęć tygodniowo</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterGroup} onValueChange={(v) => v && setFilterGroup(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Grupa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie grupy</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name} ({g.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdminOrCoach && (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" />
              Dodaj termin
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : byDay.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {schedules.length === 0
                ? "Brak zaplanowanych zajęć. Dodaj pierwszy termin!"
                : "Brak zajęć dla wybranej grupy."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {byDay.map(({ day, items }) => (
            <Card key={day} className={`border-2 ${DAY_COLORS[day] || ""}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{DAYS[day]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border bg-white p-3 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{s.group.name}</Badge>
                        <Badge variant="secondary">{s.group.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">
                          {s.startTime} — {s.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {s.location}
                      </div>
                      {isAdminOrCoach && (
                        <div className="flex gap-1 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditing(s); setDialogOpen(true); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ScheduleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        schedule={editing}
        groups={groups}
        onSaved={fetchData}
      />
    </div>
  );
}

function ScheduleDialog({
  open,
  onClose,
  schedule,
  groups,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  groups: Group[];
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    groupId: "",
    dayOfWeek: "1",
    startTime: "17:00",
    endTime: "18:30",
    location: "",
  });

  useEffect(() => {
    if (schedule) {
      setForm({
        groupId: schedule.groupId,
        dayOfWeek: schedule.dayOfWeek.toString(),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        location: schedule.location,
      });
    } else {
      setForm({ groupId: groups[0]?.id || "", dayOfWeek: "1", startTime: "17:00", endTime: "18:30", location: "" });
    }
  }, [schedule, open, groups]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const body = {
      groupId: form.groupId,
      dayOfWeek: parseInt(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location,
    };

    const url = schedule ? `/api/schedules/${schedule.id}` : "/api/schedules";
    const method = schedule ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(schedule ? "Zaktualizowano" : "Dodano termin");
      onSaved();
      onClose();
    } else {
      toast.error("Błąd zapisu");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{schedule ? "Edytuj termin" : "Nowy termin"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Grupa</Label>
            <Select value={form.groupId} onValueChange={(v) => v && setForm({ ...form, groupId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz grupę" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name} ({g.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Dzień tygodnia</Label>
            <Select value={form.dayOfWeek} onValueChange={(v) => v && setForm({ ...form, dayOfWeek: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Od</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Do</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Miejsce</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="np. Lodowisko Siedlce"
              required
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Zapisywanie..." : schedule ? "Zapisz" : "Dodaj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
