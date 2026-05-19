"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, LayoutList, Grid3X3, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FitnessResultRow {
  id: string;
  playerId: string;
  year: number;
  month: number;
  testCode: string;
  rawValue: number | null;
  grade: number | null;
  notes: string | null;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  category: string;
  position: string | null;
  jerseyNum: number | null;
  status: string;
  pesel: string | null;
  notes: string | null;
}

const CATEGORIES = ["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"];
const CAT_INFO: Record<string, { label: string; years: string; color: string; bg: string; border: string }> = {
  U8:     { label: "Mikrus U8",      years: "ur. 2018-2020", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  U10:    { label: "Mini U10",       years: "ur. 2016-2017", color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200" },
  U12:    { label: "Mini Hokej U12", years: "ur. 2014-2017", color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200" },
  U14:    { label: "Młodzik U14",    years: "ur. 2011-2013", color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  U16:    { label: "Junior U16",     years: "ur. 2009-2010", color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200" },
  U18:    { label: "Senior U18",     years: "ur. 2007-2008", color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
  SENIOR: { label: "Senior",         years: "dorośli",       color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200" },
};
const POSITIONS = [
  { value: "GOALIE", label: "Bramkarz" },
  { value: "DEFENDER", label: "Obrońca" },
  { value: "FORWARD", label: "Napastnik" },
];
const STATUSES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Aktywny", variant: "default" },
  INACTIVE: { label: "Nieaktywny", variant: "secondary" },
  INJURED: { label: "Kontuzja", variant: "destructive" },
  SUSPENDED: { label: "Zawieszony", variant: "outline" },
};

// ── Testy sprawnościowe ─────────────────────────────────────────────────────

const MONTHS = [
  { n: 1, label: "Styczeń" }, { n: 2, label: "Luty" }, { n: 3, label: "Marzec" },
  { n: 4, label: "Kwiecień" }, { n: 5, label: "Maj" }, { n: 6, label: "Czerwiec" },
  { n: 7, label: "Lipiec" }, { n: 8, label: "Sierpień" }, { n: 9, label: "Wrzesień" },
  { n: 10, label: "Październik" }, { n: 11, label: "Listopad" }, { n: 12, label: "Grudzień" },
];

type TestDef = {
  code: string; name: string; unit: string;
  dir: "asc" | "desc"; t4: number; t3: number; t2: number; source: string;
};

const TESTS_U10: TestDef[] = [
  { code: "T1", name: "Skok w dal",      unit: "cm", dir: "asc",  t4: 145,  t3: 125,  t2: 105,  source: "🍁🇨🇿" },
  { code: "T2", name: "MB Toss 1 kg",    unit: "m",  dir: "asc",  t4: 4.2,  t3: 3.2,  t2: 2.2,  source: "🍁" },
  { code: "T3", name: "5-10-5 Shuttle",  unit: "s",  dir: "desc", t4: 10.2, t3: 11.2, t2: 12.3, source: "🍁" },
  { code: "T4", name: "Sit & Reach",     unit: "cm", dir: "asc",  t4: 14,   t3: 8,    t2: 4,    source: "🍁" },
  { code: "T5", name: "Równowaga",       unit: "s",  dir: "asc",  t4: 42,   t3: 28,   t2: 14,   source: "🍁" },
  { code: "T6", name: "Léger Shuttle",   unit: "lv", dir: "asc",  t4: 8,    t3: 6,    t2: 4,    source: "🍁" },
  { code: "T7", name: "T-Test",          unit: "s",  dir: "desc", t4: 11.5, t3: 12.5, t2: 13.5, source: "🍁" },
];

const TESTS_U15: TestDef[] = [
  { code: "T1", name: "Skok w dal",      unit: "cm", dir: "asc",  t4: 210,  t3: 185,  t2: 160,  source: "🍁🇨🇿" },
  { code: "T2", name: "Sprint 40m",      unit: "s",  dir: "desc", t4: 5.0,  t3: 5.4,  t2: 5.9,  source: "🍁" },
  { code: "T3", name: "Illinois",        unit: "s",  dir: "desc", t4: 14.8, t3: 15.7, t2: 16.8, source: "🇨🇿" },
  { code: "T4", name: "Bench Press 60%", unit: "n",  dir: "asc",  t4: 10,   t3: 7,    t2: 4,    source: "🇨🇿" },
  { code: "T5", name: "MB Toss 3 kg",    unit: "m",  dir: "asc",  t4: 7.0,  t3: 5.5,  t2: 4.0,  source: "🍁" },
  { code: "T6", name: "Léger / 1500m",  unit: "lv", dir: "asc",  t4: 12,   t3: 10,   t2: 8,    source: "🍁🇨🇿" },
  { code: "T7", name: "RHIET drop",      unit: "%",  dir: "desc", t4: 3,    t3: 6,    t2: 12,   source: "🍁" },
];

function getTests(category: string): TestDef[] {
  return ["U8", "U10"].includes(category) ? TESTS_U10 : TESTS_U15;
}

function getTestSetLabel(category: string) {
  return ["U8", "U10"].includes(category) ? "U10 · HC LTAD" : "U15 · HC + ČSLH";
}

function calcGrade(test: TestDef, value: number): number {
  if (test.dir === "asc") {
    if (value >= test.t4) return 4;
    if (value >= test.t3) return 3;
    if (value >= test.t2) return 2;
    return 1;
  } else {
    if (value <= test.t4) return 4;
    if (value <= test.t3) return 3;
    if (value <= test.t2) return 2;
    return 1;
  }
}

function gradeCls(grade: number | null) {
  if (grade === null) return "bg-gray-100 text-gray-400";
  if (grade >= 4) return "bg-green-100 text-green-800 border border-green-300";
  if (grade >= 3) return "bg-blue-100 text-blue-800 border border-blue-300";
  if (grade >= 2) return "bg-yellow-100 text-yellow-800 border border-yellow-300";
  return "bg-red-100 text-red-800 border border-red-300";
}

// ───────────────────────────────────────────────────────────────────────────

export default function PlayersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [grouped, setGrouped] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [devPlayer, setDevPlayer] = useState<Player | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/players");
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch {
      toast.error("Błąd pobierania zawodników");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchPlayers();
  }, [authStatus, router, fetchPlayers]);

  const filtered = players.filter((p) => {
    const matchesSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleDelete(id: string) {
    if (!confirm("Czy na pewno chcesz usunąć tego zawodnika?")) return;
    const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Zawodnik usunięty");
      fetchPlayers();
    } else {
      toast.error("Błąd usuwania");
    }
  }

  function openCreate() {
    setEditingPlayer(null);
    setDialogOpen(true);
  }

  function openEdit(player: Player) {
    setEditingPlayer(player);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zawodnicy</h1>
          <p className="text-muted-foreground">
            {players.length} zawodników w bazie
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj zawodnika
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj zawodnika..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={(v) => v && setFilterCategory(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Kategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Wszystkie</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={grouped ? "default" : "outline"}
              size="sm"
              onClick={() => setGrouped((g) => !g)}
              className="gap-1.5"
            >
              {grouped ? <Grid3X3 className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
              {grouped ? "Grupuj" : "Lista"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {players.length === 0
                ? "Brak zawodników. Dodaj pierwszego!"
                : "Brak wyników dla podanych filtrów."}
            </p>
          ) : grouped && filterCategory === "ALL" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{filtered.length} z {players.length} zawodników</p>
              {CATEGORIES.map((cat) => {
                const catPlayers = filtered.filter((p) => p.category === cat);
                if (catPlayers.length === 0) return null;
                const info = CAT_INFO[cat] || { label: cat, years: "", color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" };
                const isCollapsed = collapsedCats.has(cat);
                return (
                  <div key={cat}>
                    <button
                      onClick={() => setCollapsedCats((prev) => {
                        const s = new Set(prev);
                        s.has(cat) ? s.delete(cat) : s.add(cat);
                        return s;
                      })}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border ${info.bg} ${info.border} cursor-pointer hover:opacity-90 transition-opacity`}
                    >
                      <span className={`text-xs transition-transform ${isCollapsed ? "-rotate-90" : ""}`}>▼</span>
                      <span className={`font-semibold ${info.color}`}>{info.label}</span>
                      <span className={`text-sm opacity-70 ${info.color}`}>{info.years}</span>
                      <span className={`ml-auto font-semibold ${info.color}`}>{catPlayers.length} zaw.</span>
                    </button>
                    {!isCollapsed && (
                      <div className="overflow-x-auto mt-1">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nazwisko i imię</TableHead>
                              <TableHead>Pozycja</TableHead>
                              <TableHead>Nr</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {catPlayers.map((player) => {
                              const st = STATUSES[player.status] || STATUSES.ACTIVE;
                              const pos = POSITIONS.find((p) => p.value === player.position);
                              return (
                                <TableRow key={player.id}>
                                  <TableCell className="font-medium">
                                    {player.lastName} {player.firstName}
                                  </TableCell>
                                  <TableCell>{pos?.label || "—"}</TableCell>
                                  <TableCell>{player.jerseyNum ?? "—"}</TableCell>
                                  <TableCell>
                                    <Badge variant={st.variant}>{st.label}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right space-x-1">
                                    <Button variant="ghost" size="icon" title="Karta rozwoju" onClick={() => setDevPlayer(player)}>
                                      <ClipboardList className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(player)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    {session?.user.role === "ADMIN" && (
                                      <Button variant="ghost" size="icon" onClick={() => handleDelete(player.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwisko i imię</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Pozycja</TableHead>
                    <TableHead>Nr</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((player) => {
                    const st = STATUSES[player.status] || STATUSES.ACTIVE;
                    const pos = POSITIONS.find((p) => p.value === player.position);
                    return (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          {player.lastName} {player.firstName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.category}</Badge>
                        </TableCell>
                        <TableCell>{pos?.label || "—"}</TableCell>
                        <TableCell>{player.jerseyNum ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" title="Karta rozwoju" onClick={() => setDevPlayer(player)}>
                            <ClipboardList className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(player)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {session?.user.role === "ADMIN" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(player.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PlayerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        player={editingPlayer}
        onSaved={fetchPlayers}
      />

      <DevelopmentCardDialog
        player={devPlayer}
        onClose={() => setDevPlayer(null)}
      />
    </div>
  );
}

function PlayerDialog({
  open,
  onClose,
  player,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  player: Player | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    category: "U12",
    position: "",
    jerseyNum: "",
    pesel: "",
    notes: "",
  });

  useEffect(() => {
    if (player) {
      setForm({
        firstName: player.firstName,
        lastName: player.lastName,
        dateOfBirth: player.dateOfBirth.split("T")[0],
        category: player.category,
        position: player.position || "",
        jerseyNum: player.jerseyNum?.toString() || "",
        pesel: player.pesel || "",
        notes: player.notes || "",
      });
    } else {
      setForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        category: "U12",
        position: "",
        jerseyNum: "",
        pesel: "",
        notes: "",
      });
    }
  }, [player, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const body = {
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth,
      category: form.category,
      position: form.position || undefined,
      jerseyNum: form.jerseyNum ? parseInt(form.jerseyNum) : undefined,
      pesel: form.pesel || undefined,
      notes: form.notes || undefined,
    };

    const url = player ? `/api/players/${player.id}` : "/api/players";
    const method = player ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(player ? "Zaktualizowano zawodnika" : "Dodano zawodnika");
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error?.fieldErrors ? "Sprawdź formularz" : "Błąd zapisu");
      }
    } catch {
      toast.error("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {player ? "Edytuj zawodnika" : "Nowy zawodnik"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Imię</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Nazwisko</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Data urodzenia</Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Kategoria</Label>
              <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Pozycja</Label>
              <Select value={form.position} onValueChange={(v) => v && setForm({ ...form, position: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nr koszulki</Label>
              <Input
                type="number"
                value={form.jerseyNum}
                onChange={(e) => setForm({ ...form, jerseyNum: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>PESEL</Label>
            <Input
              value={form.pesel}
              onChange={(e) => setForm({ ...form, pesel: e.target.value })}
              placeholder="Opcjonalny"
            />
          </div>

          <div className="space-y-1">
            <Label>Notatki</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Opcjonalne"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Zapisywanie..." : player ? "Zapisz" : "Dodaj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Karta Rozwoju Hokejowego ────────────────────────────────────────────────

function DevelopmentCardDialog({
  player,
  onClose,
}: {
  player: Player | null;
  onClose: () => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [allResults, setAllResults] = useState<FitnessResultRow[]>([]);
  const [rowValues, setRowValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const tests = player ? getTests(player.category) : TESTS_U15;
  const setLabel = player ? getTestSetLabel(player.category) : "";

  useEffect(() => {
    if (!player) return;
    setLoading(true);
    fetch(`/api/fitness-tests?playerId=${player.id}`)
      .then((r) => r.json())
      .then((data) => { setAllResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [player]);

  useEffect(() => {
    if (!player) return;
    const vals: Record<string, string> = {};
    tests.forEach((t) => {
      const found = allResults.find(
        (r) => r.year === year && r.month === month && r.testCode === t.code
      );
      vals[t.code] = found?.rawValue != null ? String(found.rawValue) : "";
    });
    setRowValues(vals);
  }, [year, month, allResults, tests, player]);

  async function handleSave() {
    if (!player) return;
    setSaving(true);
    try {
      for (const test of tests) {
        const raw = rowValues[test.code];
        const rawNum = raw !== "" && raw !== undefined ? parseFloat(raw) : null;
        const grade = rawNum !== null && !isNaN(rawNum) ? calcGrade(test, rawNum) : null;
        await fetch("/api/fitness-tests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: player.id, year, month,
            testCode: test.code, rawValue: rawNum, grade,
          }),
        });
      }
      const res = await fetch(`/api/fitness-tests?playerId=${player.id}`);
      setAllResults(await res.json());
      toast.success(`Wyniki zapisane — ${MONTHS.find((m) => m.n === month)?.label} ${year}`);
    } catch {
      toast.error("Błąd zapisu");
    } finally {
      setSaving(false);
    }
  }

  const filledMonths = [
    ...new Set(
      allResults
        .filter((r) => r.year === year && r.rawValue != null)
        .map((r) => r.month)
    ),
  ].sort((a, b) => a - b);

  function monthAvg(m: number) {
    const grades = allResults
      .filter((r) => r.year === year && r.month === m && r.grade != null)
      .map((r) => r.grade!);
    if (!grades.length) return null;
    return Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10;
  }

  function currentGrades() {
    return tests
      .map((t) => {
        const raw = rowValues[t.code];
        if (!raw || raw === "") return null;
        const n = parseFloat(raw);
        return isNaN(n) ? null : calcGrade(t, n);
      })
      .filter(Boolean) as number[];
  }

  if (!player) return null;

  const grades = currentGrades();
  const avgNow =
    grades.length
      ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100
      : null;

  function normText(test: TestDef) {
    if (test.dir === "asc")
      return `≥${test.t4} / ${test.t3}–${test.t4 - 0.01} / ${test.t2}–${test.t3 - 0.01} / <${test.t2}`;
    return `≤${test.t4} / ${test.t4}–${test.t3} / ${test.t3}–${test.t2} / >${test.t2}`;
  }

  return (
    <Dialog open={!!player} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <ClipboardList className="h-5 w-5 text-blue-600 shrink-0" />
            <span>Karta Rozwoju — {player.lastName} {player.firstName}</span>
            <Badge variant="outline">{player.category}</Badge>
            <span className="text-xs font-normal text-muted-foreground">{setLabel}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Rok + Miesiąc */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Rok:</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Miesiąc:</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.n} value={String(m.n)}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela wpisywania wyników */}
        {loading ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Ładowanie…</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs">
                  <th className="text-left px-3 py-2 font-medium w-8">#</th>
                  <th className="text-left px-3 py-2 font-medium">Test</th>
                  <th className="text-center px-2 py-2 font-medium w-10">Jedn.</th>
                  <th className="text-center px-2 py-2 font-medium w-10">Źr.</th>
                  <th className="text-center px-3 py-2 font-medium w-36">Wartość</th>
                  <th className="text-center px-3 py-2 font-medium w-16">Ocena</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">
                    Norma (4 / 3 / 2 / 1)
                  </th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test, i) => {
                  const raw = rowValues[test.code] ?? "";
                  const rawNum = raw !== "" ? parseFloat(raw) : null;
                  const grade =
                    rawNum !== null && !isNaN(rawNum) ? calcGrade(test, rawNum) : null;
                  return (
                    <tr key={test.code} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{test.code}</td>
                      <td className="px-3 py-2 font-medium">{test.name}</td>
                      <td className="px-2 py-2 text-center text-xs text-muted-foreground">{test.unit}</td>
                      <td className="px-2 py-2 text-center text-xs">{test.source}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={raw}
                            onChange={(e) =>
                              setRowValues((prev) => ({ ...prev, [test.code]: e.target.value }))
                            }
                            className="h-7 w-20 text-sm text-right"
                            placeholder="—"
                          />
                          <span className="text-xs text-muted-foreground">{test.unit}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {grade !== null ? (
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${gradeCls(grade)}`}
                          >
                            {grade}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono hidden md:table-cell">
                        {normText(test)}
                      </td>
                    </tr>
                  );
                })}
                {/* Wiersz średniej */}
                {avgNow !== null && (
                  <tr className="bg-muted/40 font-semibold border-t">
                    <td colSpan={4} className="px-3 py-2 text-xs text-right text-muted-foreground">
                      Średnia:
                    </td>
                    <td />
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-8 rounded text-sm font-bold ${gradeCls(Math.round(avgNow))}`}
                      >
                        {avgNow.toFixed(1)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Legenda */}
        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
          {[
            { g: 4, cls: "bg-green-100 border-green-300", label: "4 — Bardzo dobry" },
            { g: 3, cls: "bg-blue-100 border-blue-300",   label: "3 — Dobry" },
            { g: 2, cls: "bg-yellow-100 border-yellow-300", label: "2 — Przeciętny" },
            { g: 1, cls: "bg-red-100 border-red-300",     label: "1 — Do poprawy" },
          ].map(({ cls, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full border inline-block ${cls}`} />
              {label}
            </span>
          ))}
          <span className="ml-auto text-xs opacity-70">🍁 Hockey Canada · 🇨🇿 ČSLH FTVS Praha</span>
        </div>

        {/* Przycisk zapisu */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving
              ? "Zapisywanie…"
              : `Zapisz — ${MONTHS.find((m) => m.n === month)?.label} ${year}`}
          </Button>
        </div>

        {/* Historia */}
        {filledMonths.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
              Historia {year}
            </h3>
            <div className="overflow-x-auto">
              <table className="text-xs w-full border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-2 py-1.5 font-medium whitespace-nowrap">Test</th>
                    {filledMonths.map((m) => (
                      <th
                        key={m}
                        className={`px-2 py-1.5 font-medium text-center ${m === month ? "bg-blue-50 text-blue-700" : ""}`}
                      >
                        {MONTHS.find((mo) => mo.n === m)?.label.slice(0, 3)}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 font-medium text-center bg-muted/40">Śr.</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test, i) => {
                    const allGrades = filledMonths.map((m) => {
                      const r = allResults.find(
                        (x) => x.year === year && x.month === m && x.testCode === test.code
                      );
                      return r?.grade ?? null;
                    });
                    const valid = allGrades.filter((g) => g !== null) as number[];
                    const avg =
                      valid.length
                        ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
                        : null;
                    return (
                      <tr key={test.code} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                        <td className="px-2 py-1 font-medium whitespace-nowrap">
                          {test.code} {test.name}
                        </td>
                        {filledMonths.map((m) => {
                          const r = allResults.find(
                            (x) => x.year === year && x.month === m && x.testCode === test.code
                          );
                          return (
                            <td
                              key={m}
                              className={`px-2 py-1 text-center ${m === month ? "bg-blue-50" : ""}`}
                            >
                              {r?.grade != null ? (
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${gradeCls(r.grade)}`}
                                >
                                  {r.grade}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1 text-center bg-muted/30 font-semibold">
                          {avg != null ? (
                            <span
                              className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${gradeCls(Math.round(avg))}`}
                            >
                              {avg.toFixed(1)}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Wiersz średnich miesięcznych */}
                  <tr className="bg-muted/40 font-semibold border-t">
                    <td className="px-2 py-1 text-muted-foreground">Śr. miesiąca</td>
                    {filledMonths.map((m) => {
                      const avg = monthAvg(m);
                      return (
                        <td
                          key={m}
                          className={`px-2 py-1 text-center ${m === month ? "bg-blue-50" : ""}`}
                        >
                          {avg != null ? (
                            <span
                              className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${gradeCls(Math.round(avg))}`}
                            >
                              {avg.toFixed(1)}
                            </span>
                          ) : "—"}
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
