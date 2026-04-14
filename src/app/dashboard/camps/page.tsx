"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Tent,
  Plus,
  MapPin,
  Calendar,
  Users,
  Trash2,
  ChevronRight,
  DollarSign,
  UserCheck,
  Clock,
  Ban,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

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
  group: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  _count: { registrations: number };
}

interface Registration {
  id: string;
  status: string;
  paidAmount: number;
  parentNotes: string | null;
  adminNotes: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    category: string;
    jerseyNum: number | null;
  };
}

interface Group {
  id: string;
  name: string;
  category: string;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  jerseyNum: number | null;
}

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  CAMP: { label: "Obóz", color: "bg-green-100 text-green-700" },
  TRIP: { label: "Wyjazd", color: "bg-sky-100 text-sky-700" },
  WORKSHOP: { label: "Warsztaty", color: "bg-purple-100 text-purple-700" },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Zaplanowany", color: "bg-gray-100 text-gray-700" },
  OPEN: { label: "Zapisy otwarte", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "Zapisy zamknięte", color: "bg-yellow-100 text-yellow-700" },
  IN_PROGRESS: { label: "W trakcie", color: "bg-sky-100 text-sky-700" },
  COMPLETED: { label: "Zakończony", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Odwołany", color: "bg-red-100 text-red-700" },
};

const REG_STATUS: Record<string, { label: string; color: string }> = {
  REGISTERED: { label: "Zapisany", color: "text-blue-600" },
  CONFIRMED: { label: "Potwierdzony", color: "text-green-600" },
  WAITLIST: { label: "Rezerwowa", color: "text-yellow-600" },
  CANCELLED: { label: "Anulowany", color: "text-red-600" },
};

const CATEGORIES = ["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"];

export default function CampsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const isAdminOrCoach = session?.user?.role === "ADMIN" || session?.user?.role === "COACH";

  const [camps, setCamps] = useState<Camp[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("ALL");

  const fetchData = useCallback(async () => {
    try {
      const [cRes, gRes] = await Promise.all([
        fetch("/api/camps"),
        fetch("/api/groups"),
      ]);
      if (cRes.ok) setCamps(await cRes.json());
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

  const filtered = camps.filter((c) => filterType === "ALL" || c.type === filterType);

  async function handleDelete(id: string) {
    if (!confirm("Usunąć obóz/wyjazd?")) return;
    const res = await fetch(`/api/camps/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usunięto"); fetchData(); }
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/camps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Status zmieniony"); fetchData(); }
  }

  // Statystyki
  const upcoming = camps.filter((c) => ["PLANNED", "OPEN"].includes(c.status)).length;
  const active = camps.filter((c) => c.status === "IN_PROGRESS").length;
  const totalRegistered = camps.reduce((sum, c) => sum + c._count.registrations, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Obozy i wyjazdy</h1>
          <p className="text-muted-foreground">{camps.length} wydarzeń</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie</SelectItem>
              {Object.entries(TYPE_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdminOrCoach && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nowy
            </Button>
          )}
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-sky-600">{upcoming}</p>
            <p className="text-xs text-muted-foreground">Nadchodzących</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">{active}</p>
            <p className="text-xs text-muted-foreground">W trakcie</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{totalRegistered}</p>
            <p className="text-xs text-muted-foreground">Zapisanych</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak obozów i wyjazdów.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((camp) => {
            const typeInfo = TYPE_MAP[camp.type] || TYPE_MAP.CAMP;
            const statusInfo = STATUS_MAP[camp.status] || STATUS_MAP.PLANNED;
            const spotsLeft = camp.maxSpots ? camp.maxSpots - camp._count.registrations : null;
            const days = Math.ceil(
              (new Date(camp.endDate).getTime() - new Date(camp.startDate).getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;

            return (
              <Card key={camp.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {camp.category && <Badge variant="outline">{camp.category}</Badge>}
                      </div>
                      <CardTitle className="text-lg">{camp.name}</CardTitle>
                    </div>
                    {isAdminOrCoach && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(camp.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {camp.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(camp.startDate).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                      {" – "}
                      {new Date(camp.endDate).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {days} dni
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {camp._count.registrations}{camp.maxSpots ? `/${camp.maxSpots}` : ""} zapisanych
                    </span>
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <span className="text-green-600 text-xs font-medium">
                        {spotsLeft} wolnych miejsc
                      </span>
                    )}
                    {spotsLeft !== null && spotsLeft <= 0 && (
                      <span className="text-red-600 text-xs font-medium">Brak miejsc</span>
                    )}
                    {camp.cost > 0 && (
                      <span className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        {camp.cost} PLN
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {isAdminOrCoach && (
                      <Select
                        value={camp.status}
                        onValueChange={(v) => v && handleStatusChange(camp.id, v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-[155px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_MAP).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto"
                      onClick={() => setDetailId(camp.id)}
                    >
                      Szczegóły <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCampDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        groups={groups}
        onSaved={fetchData}
      />

      {detailId && (
        <CampDetailDialog
          campId={detailId}
          onClose={() => setDetailId(null)}
          isAdminOrCoach={isAdminOrCoach}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
}

// ==================== Dialog tworzenia ====================

function CreateCampDialog({
  open, onClose, groups, onSaved,
}: {
  open: boolean; onClose: () => void; groups: Group[]; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "CAMP", location: "", startDate: "", endDate: "",
    category: "", description: "", cost: 0, maxSpots: "", groupId: "",
  });

  useEffect(() => {
    if (open) setForm({
      name: "", type: "CAMP", location: "", startDate: "", endDate: "",
      category: "", description: "", cost: 0, maxSpots: "", groupId: "",
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/camps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        category: form.category || null,
        cost: Number(form.cost),
        maxSpots: form.maxSpots ? Number(form.maxSpots) : null,
        groupId: form.groupId || null,
      }),
    });
    if (res.ok) {
      toast.success("Utworzono");
      onSaved();
      onClose();
    } else {
      toast.error("Błąd tworzenia");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy obóz / wyjazd</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nazwa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="np. Obóz letni 2026" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Kategoria</Label>
              <Select value={form.category || "NONE"} onValueChange={(v) => v && setForm({ ...form, category: v === "NONE" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Wszystkie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Wszystkie</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Lokalizacja</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="np. Zakopane" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Data rozpoczęcia</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Data zakończenia</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Koszt (PLN)</Label>
              <Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Limit miejsc</Label>
              <Input type="number" min={1} value={form.maxSpots} onChange={(e) => setForm({ ...form, maxSpots: e.target.value })} placeholder="Bez limitu" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Grupa</Label>
            <Select value={form.groupId || "NONE"} onValueChange={(v) => v && setForm({ ...form, groupId: v === "NONE" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Brak</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Opis</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>
              <Tent className="h-4 w-4 mr-1" />
              {loading ? "Tworzenie..." : "Utwórz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Dialog szczegółów ====================

function CampDetailDialog({
  campId, onClose, isAdminOrCoach, onUpdated,
}: {
  campId: string; onClose: () => void; isAdminOrCoach: boolean; onUpdated: () => void;
}) {
  const [camp, setCamp] = useState<(Camp & { registrations: Registration[] }) | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [addingPlayers, setAddingPlayers] = useState(false);

  const fetchCamp = useCallback(async () => {
    const res = await fetch(`/api/camps/${campId}`);
    if (res.ok) setCamp(await res.json());
  }, [campId]);

  useEffect(() => {
    fetchCamp();
    fetch("/api/players").then((r) => r.json()).then(setPlayers).catch(() => {});
  }, [fetchCamp]);

  async function addRegistrations() {
    if (selectedPlayers.length === 0) return;
    const res = await fetch(`/api/camps/${campId}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds: selectedPlayers }),
    });
    if (res.ok) {
      toast.success("Zapisano");
      setSelectedPlayers([]);
      setAddingPlayers(false);
      fetchCamp();
      onUpdated();
    }
  }

  async function updateRegistration(regId: string, data: Record<string, unknown>) {
    await fetch(`/api/camps/${campId}/registrations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: regId, ...data }),
    });
    fetchCamp();
  }

  async function removeRegistration(regId: string) {
    await fetch(`/api/camps/${campId}/registrations?registrationId=${regId}`, { method: "DELETE" });
    fetchCamp();
    onUpdated();
  }

  if (!camp) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent><p className="text-center py-8 text-muted-foreground">Ładowanie...</p></DialogContent>
      </Dialog>
    );
  }

  const registeredIds = camp.registrations.map((r) => r.player.id);
  const availablePlayers = players.filter(
    (p) => !registeredIds.includes(p.id) && (!camp.category || p.category === camp.category)
  );

  const confirmed = camp.registrations.filter((r) => r.status === "CONFIRMED").length;
  const totalPaid = camp.registrations.reduce((sum, r) => sum + r.paidAmount, 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tent className="h-5 w-5" />
            {camp.name}
            {camp.category && <Badge variant="outline">{camp.category}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2 flex-wrap">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {camp.location}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(camp.startDate).toLocaleDateString("pl-PL")} – {new Date(camp.endDate).toLocaleDateString("pl-PL")}
          </span>
          {camp.cost > 0 && <span className="font-medium">{camp.cost} PLN</span>}
        </div>

        {camp.description && (
          <p className="text-sm text-muted-foreground mb-3">{camp.description}</p>
        )}

        {/* Podsumowanie */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{camp.registrations.length}{camp.maxSpots ? `/${camp.maxSpots}` : ""}</p>
            <p className="text-xs text-muted-foreground">Zapisanych</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-green-600">{confirmed}</p>
            <p className="text-xs text-muted-foreground">Potwierdzonych</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{totalPaid} PLN</p>
            <p className="text-xs text-muted-foreground">Wpłacono</p>
          </div>
        </div>

        {/* Lista zapisanych */}
        <h3 className="font-medium text-sm mb-2">Uczestnicy</h3>
        {camp.registrations.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">Brak zapisanych</p>
        ) : (
          <div className="space-y-2 mb-4">
            {camp.registrations.map((reg) => {
              const st = REG_STATUS[reg.status] || REG_STATUS.REGISTERED;
              return (
                <div key={reg.id} className="flex items-center gap-3 p-2.5 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {reg.player.jerseyNum && <span className="text-muted-foreground mr-1">#{reg.player.jerseyNum}</span>}
                      {reg.player.firstName} {reg.player.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={st.color}>{st.label}</span>
                      {camp.cost > 0 && (
                        <span>Wpłata: {reg.paidAmount}/{camp.cost} PLN</span>
                      )}
                    </div>
                  </div>
                  {isAdminOrCoach && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Select
                        value={reg.status}
                        onValueChange={(v) => v && updateRegistration(reg.id, { status: v })}
                      >
                        <SelectTrigger className="h-7 text-xs w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(REG_STATUS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {camp.cost > 0 && (
                        <Input
                          type="number"
                          min={0}
                          max={camp.cost}
                          className="w-20 h-7 text-xs"
                          defaultValue={reg.paidAmount}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== reg.paidAmount) {
                              updateRegistration(reg.id, { paidAmount: val });
                            }
                          }}
                        />
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removeRegistration(reg.id)}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Dodawanie uczestników */}
        {isAdminOrCoach && !addingPlayers && (
          <Button size="sm" variant="outline" onClick={() => setAddingPlayers(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Dodaj uczestników
          </Button>
        )}

        {isAdminOrCoach && addingPlayers && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Zapisz zawodników</p>
            {availablePlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak dostępnych zawodników</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-1">
                {availablePlayers.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-md cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(p.id)}
                      onChange={(e) =>
                        setSelectedPlayers((prev) =>
                          e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id)
                        )
                      }
                      className="h-4 w-4"
                    />
                    {p.jerseyNum && <span className="text-muted-foreground">#{p.jerseyNum}</span>}
                    {p.firstName} {p.lastName}
                    <Badge variant="outline" className="ml-auto text-xs">{p.category}</Badge>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => { setAddingPlayers(false); setSelectedPlayers([]); }}>
                Anuluj
              </Button>
              <Button size="sm" onClick={addRegistrations} disabled={selectedPlayers.length === 0}>
                Zapisz ({selectedPlayers.length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
