"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, LayoutList, Grid3X3 } from "lucide-react";
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
