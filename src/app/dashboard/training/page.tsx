"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  ChevronRight,
  Dumbbell,
  Clock,
  Target,
  GripVertical,
  X,
  Download,
  Pencil,
  Upload,
  FileSpreadsheet,
  FileText,
  Calendar,
  List,
  Printer,
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

type PlanTypeEnum = "YEARLY" | "SEASONAL" | "MONTHLY" | "WEEKLY";

interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  category: string;
  planType: PlanTypeEnum;
  parentPlanId: string | null;
  parentPlan: { id: string; name: string; planType: PlanTypeEnum } | null;
  season: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  summary: string | null;
  totalSessions: number;
  totalDuration: number;
  group: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  _count: { sessions: number; childPlans: number };
  updatedAt: string;
}

interface Drill {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration: number | null;
  difficulty: number;
  ageGroups: string | null;
}

interface SessionDrill {
  id: string;
  order: number;
  duration: number | null;
  notes: string | null;
  drill: Drill;
}

interface TrainingSession {
  id: string;
  title: string;
  date: string | null;
  duration: number;
  objectives: string | null;
  notes: string | null;
  order: number;
  drills: SessionDrill[];
}

interface PlanDetail extends TrainingPlan {
  sessions: TrainingSession[];
}

interface Group {
  id: string;
  name: string;
  category: string;
}

const DRILL_CATEGORIES: Record<string, string> = {
  SKATING: "Jazda",
  SHOOTING: "Strzały",
  PASSING: "Podania",
  STICKHANDLING: "Prowadzenie",
  TACTICS: "Taktyka",
  CONDITIONING: "Kondycja",
  GOALIE: "Bramkarz",
  WARMUP: "Rozgrzewka",
  COOLDOWN: "Schładzanie",
  GAME: "Gra",
};

const DRILL_COLORS: Record<string, string> = {
  SKATING: "bg-blue-100 text-blue-700",
  SHOOTING: "bg-red-100 text-red-700",
  PASSING: "bg-green-100 text-green-700",
  STICKHANDLING: "bg-purple-100 text-purple-700",
  TACTICS: "bg-orange-100 text-orange-700",
  CONDITIONING: "bg-yellow-100 text-yellow-700",
  GOALIE: "bg-cyan-100 text-cyan-700",
  WARMUP: "bg-lime-100 text-lime-700",
  COOLDOWN: "bg-sky-100 text-sky-700",
  GAME: "bg-pink-100 text-pink-700",
};

const CATEGORIES = ["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"];

const PLAN_TYPE_LABELS: Record<PlanTypeEnum, string> = {
  YEARLY: "Roczny",
  SEASONAL: "Sezonowy",
  MONTHLY: "Miesięczny",
  WEEKLY: "Tygodniowy",
};

const PLAN_TYPE_COLORS: Record<PlanTypeEnum, string> = {
  YEARLY: "bg-violet-100 text-violet-700",
  SEASONAL: "bg-emerald-100 text-emerald-700",
  MONTHLY: "bg-amber-100 text-amber-700",
  WEEKLY: "bg-sky-100 text-sky-700",
};

const PLAN_TYPE_CARD_STYLES: Record<PlanTypeEnum, string> = {
  YEARLY: "border-l-4 border-l-violet-500 bg-gradient-to-r from-violet-50/50 to-transparent",
  SEASONAL: "border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent",
  MONTHLY: "border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-transparent",
  WEEKLY: "border-l-4 border-l-sky-500 bg-gradient-to-r from-sky-50/50 to-transparent",
};

const PLAN_TYPE_ICON_BG: Record<PlanTypeEnum, string> = {
  YEARLY: "bg-violet-500",
  SEASONAL: "bg-emerald-500",
  MONTHLY: "bg-amber-500",
  WEEKLY: "bg-sky-500",
};

const PLAN_TYPE_ORDER: PlanTypeEnum[] = ["YEARLY", "SEASONAL", "MONTHLY", "WEEKLY"];

export default function TrainingPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const isAdminOrCoach = session?.user?.role === "ADMIN" || session?.user?.role === "COACH";

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"plans" | "drills">("plans");
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [createDrillOpen, setCreateDrillOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterPlanType, setFilterPlanType] = useState<string>("ALL");
  const [parentBrowseId, setParentBrowseId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Wszystkie plany" }]);
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  async function importProgram() {
    if (!confirm("Zaimportować program szkoleniowy SWH 2025/2026?\n\nZostanie dodanych ~70 ćwiczeń, 6 planów treningowych z sesjami, 22 turnieje HLH i 2 obozy w Giżycku.")) return;
    setImporting(true);
    try {
      const res = await fetch("/api/seed/program", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Zaimportowano: ${data.stats.drills} ćwiczeń, ${data.stats.plans} planów, ${data.stats.sessions} sesji, ${data.stats.tournaments} turniejów, ${data.stats.camps} obozów`);
        fetchData();
      } else {
        toast.error(data.error || "Błąd importu");
      }
    } catch {
      toast.error("Błąd połączenia");
    } finally {
      setImporting(false);
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [pRes, dRes, gRes] = await Promise.all([
        fetch("/api/training-plans"),
        fetch("/api/drills"),
        fetch("/api/groups"),
      ]);
      if (pRes.ok) setPlans(await pRes.json());
      if (dRes.ok) setDrills(await dRes.json());
      if (gRes.ok) {
        const data = await gRes.json();
        setGroups(data.map((g: Group) => ({ id: g.id, name: g.name, category: g.category })));
      }
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

  const filteredPlans = plans.filter((p) => {
    if (filterCategory !== "ALL" && p.category !== filterCategory) return false;
    if (filterPlanType !== "ALL" && p.planType !== filterPlanType) return false;
    // Filtruj wg nawigacji hierarchicznej
    if (parentBrowseId === null) {
      return p.parentPlanId === null; // pokaż root plans
    }
    return p.parentPlanId === parentBrowseId;
  });
  const filteredDrills = drills.filter((d) => filterCategory === "ALL" || (d.ageGroups || "").includes(filterCategory));

  function browseInto(plan: TrainingPlan) {
    setParentBrowseId(plan.id);
    setBreadcrumbs([...breadcrumbs, { id: plan.id, name: plan.name }]);
  }

  function browseTo(idx: number) {
    const crumb = breadcrumbs[idx];
    setParentBrowseId(crumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
  }

  async function deletePlan(id: string) {
    if (!confirm("Usunąć plan?")) return;
    const res = await fetch(`/api/training-plans/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usunięto"); fetchData(); }
  }

  async function deleteDrill(id: string) {
    if (!confirm("Usunąć ćwiczenie?")) return;
    const res = await fetch(`/api/drills/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usunięto"); fetchData(); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-xl p-6 text-white shadow-lg mb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Program szkoleniowy SWH</h1>
            <p className="text-sky-100 text-sm mt-1">{plans.length} planów · {drills.length} ćwiczeń · Łączą nas rolki · HLH Liga</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div></div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterCategory} onValueChange={(v) => v && setFilterCategory(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPlanType} onValueChange={(v) => v && setFilterPlanType(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Typ planu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie typy</SelectItem>
              {PLAN_TYPE_ORDER.map((t) => <SelectItem key={t} value={t}>{PLAN_TYPE_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdminOrCoach && (
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Import z pliku
            </Button>
          )}
          {isAdminOrCoach && session?.user?.role === "ADMIN" && (
            <Button variant="outline" onClick={importProgram} disabled={importing}>
              <Download className="h-4 w-4 mr-1" /> {importing ? "Importowanie..." : "Import programu SWH"}
            </Button>
          )}
          {isAdminOrCoach && tab === "plans" && (
            <Button onClick={() => setCreatePlanOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nowy plan
            </Button>
          )}
          {isAdminOrCoach && tab === "drills" && (
            <Button onClick={() => setCreateDrillOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nowe ćwiczenie
            </Button>
          )}
        </div>
      </div>

      {/* Zakładki */}
      <div className="flex gap-1 border-b">
        <button onClick={() => setTab("plans")} className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px", tab === "plans" ? "border-sky-500 text-sky-600" : "border-transparent text-muted-foreground")}>
          Plany treningowe ({filteredPlans.length})
        </button>
        <button onClick={() => setTab("drills")} className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px", tab === "drills" ? "border-sky-500 text-sky-600" : "border-transparent text-muted-foreground")}>
          Baza ćwiczeń ({filteredDrills.length})
        </button>
      </div>

      {/* Breadcrumbs nawigacji hierarchicznej */}
      {tab === "plans" && breadcrumbs.length > 1 && (
        <div className="flex items-center gap-1 text-sm flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <button
                onClick={() => browseTo(i)}
                className={cn("hover:underline", i === breadcrumbs.length - 1 ? "font-semibold text-sky-700" : "text-muted-foreground")}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : tab === "plans" ? (
        filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {parentBrowseId ? "Brak podplanów w tym planie." : "Brak planów treningowych."}
              </p>
              {!parentBrowseId && session?.user?.role === "ADMIN" && (
                <Button variant="outline" onClick={importProgram} disabled={importing}>
                  <Download className="h-4 w-4 mr-1" /> {importing ? "Importowanie..." : "Zaimportuj program SWH 2025/2026"}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className={cn("rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden", PLAN_TYPE_CARD_STYLES[plan.planType])}>
                {/* Kolorowy pasek górny */}
                <div className={cn("h-1.5", PLAN_TYPE_ICON_BG[plan.planType])} />

                <div className="p-5">
                  {/* Nagłówek */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide", PLAN_TYPE_COLORS[plan.planType])}>
                          {PLAN_TYPE_LABELS[plan.planType]}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{plan.category}</span>
                        {plan.group && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{plan.group.name}</span>}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{plan.name}</h3>
                      {plan.periodStart && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(plan.periodStart).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
                          {plan.periodEnd && ` — ${new Date(plan.periodEnd).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}`}
                        </p>
                      )}
                    </div>
                    {isAdminOrCoach && (
                      <Button variant="ghost" size="sm" className="opacity-50 hover:opacity-100" onClick={() => deletePlan(plan.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                  )}

                  {/* Statystyki */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-gray-100">
                      <p className={cn("text-xl font-bold", plan.planType === "YEARLY" ? "text-violet-600" : plan.planType === "SEASONAL" ? "text-emerald-600" : plan.planType === "MONTHLY" ? "text-amber-600" : "text-sky-600")}>
                        {plan.totalSessions || plan._count.sessions}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sesji</p>
                    </div>
                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-gray-100">
                      <p className={cn("text-xl font-bold", plan.planType === "YEARLY" ? "text-violet-600" : plan.planType === "SEASONAL" ? "text-emerald-600" : plan.planType === "MONTHLY" ? "text-amber-600" : "text-sky-600")}>
                        {plan.totalDuration > 0 ? Math.round(plan.totalDuration / 60) : Math.round((plan._count.sessions * 60) / 60)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Godzin</p>
                    </div>
                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-gray-100">
                      <p className={cn("text-xl font-bold", plan.planType === "YEARLY" ? "text-violet-600" : plan.planType === "SEASONAL" ? "text-emerald-600" : plan.planType === "MONTHLY" ? "text-amber-600" : "text-sky-600")}>
                        {plan._count.childPlans}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Podplanów</p>
                    </div>
                  </div>

                  {plan.summary && plan.planType !== "WEEKLY" && (
                    <div className="bg-white/60 rounded-lg p-2.5 mb-3 text-xs text-muted-foreground whitespace-pre-wrap border border-gray-100">
                      {plan.summary}
                    </div>
                  )}

                  {/* Stopka */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-muted-foreground">{plan.createdBy.name}</span>
                    <div className="flex items-center gap-2">
                      {plan._count.childPlans > 0 && (
                        <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => browseInto(plan)}>
                          Podplany ({plan._count.childPlans}) <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      )}
                      <Button size="sm" className={cn("text-xs h-8 text-white", PLAN_TYPE_ICON_BG[plan.planType])} onClick={() => setDetailId(plan.id)}>
                        Otwórz <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Baza ćwiczeń */
        filteredDrills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Brak ćwiczeń w bazie.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredDrills.map((drill) => (
              <div key={drill.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DRILL_COLORS[drill.category] || ""}`}>
                    {DRILL_CATEGORIES[drill.category] || drill.category}
                  </span>
                  {isAdminOrCoach && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteDrill(drill.id)}>
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="font-medium text-sm">{drill.name}</p>
                {drill.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{drill.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {drill.duration && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {drill.duration} min</span>}
                  <span>{"★".repeat(drill.difficulty)}{"☆".repeat(5 - drill.difficulty)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <CreatePlanDialog open={createPlanOpen} onClose={() => setCreatePlanOpen(false)} groups={groups} plans={plans} parentPlanId={parentBrowseId} onSaved={fetchData} />
      <CreateDrillDialog open={createDrillOpen} onClose={() => setCreateDrillOpen(false)} onSaved={fetchData} />
      {detailId && <PlanDetailDialog planId={detailId} onClose={() => setDetailId(null)} drills={drills} isAdminOrCoach={isAdminOrCoach} onUpdated={fetchData} />}
      <ImportTrainingDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} plans={plans} onSaved={fetchData} />
    </div>
  );
}

function CreatePlanDialog({ open, onClose, groups, plans, parentPlanId, onSaved }: {
  open: boolean; onClose: () => void; groups: Group[]; plans: TrainingPlan[];
  parentPlanId: string | null; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const parentPlan = parentPlanId ? plans.find((p) => p.id === parentPlanId) : null;
  const defaultCategory = parentPlan?.category || "U12";
  const [form, setForm] = useState({ name: "", description: "", category: defaultCategory, planType: "WEEKLY" as PlanTypeEnum, parentPlanId: parentPlanId || "", season: "", periodStart: "", periodEnd: "", groupId: "" });

  useEffect(() => {
    if (open) setForm({ name: "", description: "", category: parentPlan?.category || "U12", planType: parentPlanId ? "WEEKLY" : "YEARLY", parentPlanId: parentPlanId || "", season: "", periodStart: "", periodEnd: "", groupId: "" });
  }, [open, parentPlanId, parentPlan?.category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/training-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        groupId: form.groupId || null,
        parentPlanId: form.parentPlanId || null,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
        season: form.season || null,
      }),
    });
    if (res.ok) { toast.success("Plan utworzony"); onSaved(); onClose(); }
    else toast.error("Błąd");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy plan treningowy</DialogTitle>
          {parentPlan && (
            <p className="text-xs text-muted-foreground">Podplan do: {parentPlan.name}</p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nazwa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="np. Plan przygotowawczy U12 — sezon 2026/27" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Typ planu</Label>
              <Select value={form.planType} onValueChange={(v) => v && setForm({ ...form, planType: v as PlanTypeEnum })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_TYPE_ORDER.map((t) => <SelectItem key={t} value={t}>{PLAN_TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Kategoria</Label>
              <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {!parentPlanId && (
            <div className="space-y-1">
              <Label>Plan nadrzędny (opcjonalnie)</Label>
              <Select value={form.parentPlanId || "NONE"} onValueChange={(v) => v && setForm({ ...form, parentPlanId: v === "NONE" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Brak (plan główny)</SelectItem>
                  {plans.filter((p) => p.planType !== "WEEKLY").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{PLAN_TYPE_LABELS[p.planType]}: {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Okres od</Label>
              <Input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Okres do</Label>
              <Input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Sezon</Label>
              <Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="np. 2026/2027" />
            </div>
            <div className="space-y-1">
              <Label>Grupa</Label>
              <Select value={form.groupId || "NONE"} onValueChange={(v) => v && setForm({ ...form, groupId: v === "NONE" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Brak</SelectItem>
                  {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Opis</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>{loading ? "Tworzenie..." : "Utwórz"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateDrillDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", category: "SKATING", description: "", duration: "", difficulty: 1, ageGroups: "" });

  useEffect(() => { if (open) setForm({ name: "", category: "SKATING", description: "", duration: "", difficulty: 1, ageGroups: "" }); }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/drills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        duration: form.duration ? Number(form.duration) : undefined,
      }),
    });
    if (res.ok) { toast.success("Ćwiczenie dodane"); onSaved(); onClose(); }
    else toast.error("Błąd");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nowe ćwiczenie</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nazwa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="np. Slalom z krążkiem" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Kategoria</Label>
              <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DRILL_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Czas (min)</Label>
              <Input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="—" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Trudność</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setForm({ ...form, difficulty: n })} className={cn("text-lg", n <= form.difficulty ? "text-yellow-500" : "text-gray-300")}>
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Opis</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Opis ćwiczenia, zasady, warianty..." />
          </div>
          <div className="space-y-1">
            <Label>Grupy wiekowe</Label>
            <Input value={form.ageGroups} onChange={(e) => setForm({ ...form, ageGroups: e.target.value })} placeholder="np. U8,U10,U12 (puste = wszystkie)" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>{loading ? "Dodawanie..." : "Dodaj"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PlanDetailDialog({ planId, onClose, drills, isAdminOrCoach, onUpdated }: { planId: string; onClose: () => void; drills: Drill[]; isAdminOrCoach: boolean; onUpdated: () => void }) {
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [sessionForm, setSessionForm] = useState({ title: "", date: "", duration: 60, objectives: "", notes: "", drillIds: [] as string[] });

  const fetchPlan = useCallback(async () => {
    const res = await fetch(`/api/training-plans/${planId}`);
    if (res.ok) setPlan(await res.json());
  }, [planId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/training-plans/${planId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sessionForm, date: sessionForm.date || null }),
    });
    if (res.ok) {
      toast.success("Sesja dodana");
      setAddSessionOpen(false);
      setSessionForm({ title: "", date: "", duration: 60, objectives: "", notes: "", drillIds: [] });
      fetchPlan();
      onUpdated();
    }
  }

  async function deleteSession(sessionId: string) {
    await fetch(`/api/training-plans/${planId}/sessions?sessionId=${sessionId}`, { method: "DELETE" });
    fetchPlan();
    onUpdated();
  }

  if (!plan) {
    return <Dialog open onOpenChange={onClose}><DialogContent><p className="text-center py-8 text-muted-foreground">Ładowanie...</p></DialogContent></Dialog>;
  }

  const totalDuration = plan.sessions.reduce((sum, s) => sum + s.duration, 0);

  async function exportExcel() {
    if (!plan) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Arkusz info
    const info = [
      ["PLAN TRENINGOWY"],
      ["Nazwa:", plan.name],
      ["Kategoria:", plan.category],
      ["Autor:", plan.createdBy.name],
      ["Liczba sesji:", plan.sessions.length],
      ["Łączny czas:", `${totalDuration} min`],
      [""],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(info);
    wsInfo["!cols"] = [{ wch: 18 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Informacje");

    // Arkusz sesji
    const rows = [["Lp.", "Data", "Temat", "Czas (min)", "Cele", "Szczegółowy plan zajęć", "Ćwiczenia"]];
    plan.sessions.forEach((s, i) => {
      rows.push([
        String(i + 1),
        s.date ? new Date(s.date).toLocaleDateString("pl-PL") : "",
        s.title,
        String(s.duration),
        s.objectives || "",
        s.notes || "",
        s.drills.map((sd) => sd.drill.name).join(", "),
      ]);
    });
    const wsSesje = XLSX.utils.aoa_to_sheet(rows);
    wsSesje["!cols"] = [{ wch: 5 }, { wch: 14 }, { wch: 30 }, { wch: 10 }, { wch: 25 }, { wch: 40 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsSesje, "Sesje treningowe");

    const name = plan.name.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]/g, "").replace(/\s+/g, "_");
    XLSX.writeFile(wb, `Plan_treningowy_${name}.xlsx`);
    toast.success("Wyeksportowano do Excel");
  }

  async function exportWord() {
    if (!plan) return;
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel } = await import("docx");

    const headerShading = { fill: "0284c7", color: "ffffff" };

    const tableRows = plan.sessions.map((s, i) => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(i + 1), size: 20 })] })], width: { size: 5, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.date ? new Date(s.date).toLocaleDateString("pl-PL") : "—", size: 20 })] })], width: { size: 12, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.title, bold: true, size: 20 })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${s.duration} min`, size: 20 })] })], width: { size: 8, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.objectives || "—", size: 20 })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.notes || "—", size: 20 })] })], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.drills.map((sd) => sd.drill.name).join(", ") || "—", size: 20 })] })], width: { size: 10, type: WidthType.PERCENTAGE } }),
      ],
    }));

    const headerRow = new TableRow({
      tableHeader: true,
      children: ["Lp.", "Data", "Temat", "Czas", "Cele", "Plan zajęć", "Ćwiczenia"].map((text) =>
        new TableCell({
          shading: headerShading,
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "ffffff", size: 20 })] })],
        })
      ),
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `PLAN TRENINGOWY — ${plan.name}`, bold: true, size: 32 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `Kategoria: ${plan.category}  |  Autor: ${plan.createdBy.name}  |  Sesji: ${plan.sessions.length}  |  Łączny czas: ${totalDuration} min`, size: 22, color: "666666" }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...tableRows],
          }),
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `Wygenerowano z SWH Manager — ${new Date().toLocaleDateString("pl-PL")}`, size: 18, color: "999999", italics: true })],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = plan.name.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]/g, "").replace(/\s+/g, "_");
    a.href = url;
    a.download = `Plan_treningowy_${name}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Wyeksportowano do Word");
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> {plan.name}
              <Badge variant="outline">{plan.category}</Badge>
            </DialogTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={exportExcel} title="Eksport do Excel">
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportWord} title="Eksport do Word">
                <FileText className="h-4 w-4 mr-1" /> Word
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} title="Drukuj">
                <Printer className="h-4 w-4 mr-1" /> Drukuj
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Podsumowanie planu */}
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
          {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-sky-600">{plan.sessions.length}</p>
              <p className="text-xs text-muted-foreground">Sesji</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-sky-600">{totalDuration}</p>
              <p className="text-xs text-muted-foreground">Minut łącznie</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-sky-600">{plan.sessions.reduce((sum, s) => sum + s.drills.length, 0)}</p>
              <p className="text-xs text-muted-foreground">Ćwiczeń</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-sm font-medium text-sky-700 truncate">{plan.createdBy.name}</p>
              <p className="text-xs text-muted-foreground">Autor</p>
            </div>
          </div>
        </div>

        {/* Sesje treningowe — timeline */}
        <div className="space-y-0">
          {plan.sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">Brak sesji treningowych.</p>
              <p className="text-xs text-muted-foreground">Dodaj pierwszą sesję, aby rozpocząć planowanie.</p>
            </div>
          ) : (
            plan.sessions.map((s, idx) => (
              <div key={s.id} className="flex gap-3">
                {/* Timeline linia */}
                <div className="flex flex-col items-center w-10 shrink-0">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                    s.date ? "bg-sky-500 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {idx + 1}
                  </div>
                  {idx < plan.sessions.length - 1 && (
                    <div className="w-0.5 flex-1 bg-sky-200 my-1" />
                  )}
                </div>

                {/* Karta sesji */}
                <div className="flex-1 mb-4">
                  <div className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Nagłówek karty */}
                    <div className="bg-gradient-to-r from-sky-50 to-transparent p-3 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base text-gray-900">{s.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {s.date && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                                <Calendar className="h-3 w-3" />
                                {new Date(s.date).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {s.duration} min
                            </span>
                          </div>
                        </div>
                        {isAdminOrCoach && (
                          <div className="flex gap-1 ml-2">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingSession(s)}>
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteSession(s.id)}>
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Treść karty */}
                    <div className="p-3 space-y-3">
                      {s.objectives && (
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Cele</p>
                            <p className="text-sm text-gray-700">{s.objectives}</p>
                          </div>
                        </div>
                      )}

                      {s.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" /> Plan zajęć
                          </p>
                          <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{s.notes}</p>
                        </div>
                      )}

                      {s.drills.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5" /> Ćwiczenia ({s.drills.length})
                          </p>
                          <div className="space-y-1.5">
                            {s.drills.map((sd, di) => (
                              <div key={sd.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                                <span className="text-xs text-muted-foreground font-mono w-4">{di + 1}.</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DRILL_COLORS[sd.drill.category] || ""}`}>
                                  {DRILL_CATEGORIES[sd.drill.category]}
                                </span>
                                <span className="text-sm font-medium text-gray-800">{sd.drill.name}</span>
                                {(sd.duration || sd.drill.duration) && (
                                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" /> {sd.duration || sd.drill.duration} min
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {isAdminOrCoach && !addSessionOpen && (
          <Button size="sm" variant="outline" onClick={() => setAddSessionOpen(true)} className="mt-2">
            <Plus className="h-3.5 w-3.5 mr-1" /> Dodaj sesję
          </Button>
        )}

        {isAdminOrCoach && addSessionOpen && (
          <form onSubmit={addSession} className="border-t pt-4 space-y-3 mt-2">
            <p className="text-sm font-medium">Nowa sesja treningowa</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tytuł</Label>
                <Input value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} placeholder="np. Trening techniki" required />
              </div>
              <div className="space-y-1">
                <Label>Data (opcjonalnie)</Label>
                <Input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Czas (min)</Label>
                <Input type="number" min={1} value={sessionForm.duration} onChange={(e) => setSessionForm({ ...sessionForm, duration: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Cele</Label>
                <Input value={sessionForm.objectives} onChange={(e) => setSessionForm({ ...sessionForm, objectives: e.target.value })} placeholder="np. Poprawa podań" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Szczegółowy plan zajęć</Label>
              <Textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={3} placeholder="np. Rozgrzewka 10 min, slalom z krążkiem, przejście z łyżew na rolki, gra 3v3..." />
            </div>

            {/* Wybór ćwiczeń */}
            <div className="space-y-1">
              <Label>Ćwiczenia</Label>
              {sessionForm.drillIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {sessionForm.drillIds.map((id) => {
                    const d = drills.find((x) => x.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => setSessionForm({ ...sessionForm, drillIds: sessionForm.drillIds.filter((x) => x !== id) })}>
                        {d?.name} &times;
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="max-h-32 overflow-y-auto border rounded-lg p-1">
                {drills.filter((d) => !sessionForm.drillIds.includes(d.id)).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSessionForm({ ...sessionForm, drillIds: [...sessionForm.drillIds, d.id] })}
                    className="w-full text-left px-2 py-1 hover:bg-accent rounded text-xs flex items-center gap-2"
                  >
                    <span className={`px-1 py-0.5 rounded ${DRILL_COLORS[d.category] || ""}`}>{DRILL_CATEGORIES[d.category]}</span>
                    {d.name}
                    {d.duration && <span className="text-muted-foreground ml-auto">{d.duration} min</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" size="sm" variant="outline" onClick={() => setAddSessionOpen(false)}>Anuluj</Button>
              <Button type="submit" size="sm">Dodaj sesję</Button>
            </div>
          </form>
        )}

        {editingSession && (
          <EditSessionDialog
            session={editingSession}
            planId={planId}
            drills={drills}
            onClose={() => setEditingSession(null)}
            onSaved={() => { setEditingSession(null); fetchPlan(); onUpdated(); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditSessionDialog({ session, planId, drills, onClose, onSaved }: {
  session: TrainingSession; planId: string; drills: Drill[];
  onClose: () => void; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: session.title,
    date: session.date ? session.date.slice(0, 10) : "",
    duration: session.duration,
    objectives: session.objectives || "",
    notes: session.notes || "",
    drillIds: session.drills.map((sd) => sd.drill.id),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/training-plans/${planId}/sessions?sessionId=${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, date: form.date || null }),
    });
    if (res.ok) {
      toast.success("Sesja zaktualizowana");
      onSaved();
    } else {
      toast.error("Błąd zapisu");
    }
    setLoading(false);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edytuj sesję treningową</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Tytuł / Temat</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="np. Mini hokej — jazda na rolkach" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Czas (min)</Label>
              <Input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Cele</Label>
            <Input value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} placeholder="np. Poprawa techniki jazdy" />
          </div>
          <div className="space-y-1">
            <Label>Szczegółowy plan zajęć</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="np. Rozgrzewka 10 min, slalom z krążkiem, przejście z łyżew na rolki, gra 3v3..." />
          </div>
          <div className="space-y-1">
            <Label>Ćwiczenia</Label>
            {form.drillIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {form.drillIds.map((id) => {
                  const d = drills.find((x) => x.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, drillIds: form.drillIds.filter((x) => x !== id) })}>
                      {d?.name} &times;
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="max-h-32 overflow-y-auto border rounded-lg p-1">
              {drills.filter((d) => !form.drillIds.includes(d.id)).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setForm({ ...form, drillIds: [...form.drillIds, d.id] })}
                  className="w-full text-left px-2 py-1 hover:bg-accent rounded text-xs flex items-center gap-2"
                >
                  <span className={`px-1 py-0.5 rounded ${DRILL_COLORS[d.category] || ""}`}>{DRILL_CATEGORIES[d.category]}</span>
                  {d.name}
                  {d.duration && <span className="text-muted-foreground ml-auto">{d.duration} min</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>{loading ? "Zapisywanie..." : "Zapisz"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportTrainingDialog({ open, onClose, plans, onSaved }: {
  open: boolean; onClose: () => void; plans: TrainingPlan[]; onSaved: () => void;
}) {
  const [mode, setMode] = useState<"sessions" | "drills">("sessions");
  const [planId, setPlanId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number; warnings?: string[] } | null>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview([]);
      setResult(null);
      setPlanId(plans[0]?.id || "");
    }
  }, [open, plans]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    try {
      const XLSX = await import("xlsx");
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as Record<string, unknown>[];
      setPreview(rows.slice(0, 10));
    } catch {
      toast.error("Nie udało się odczytać pliku");
      setPreview([]);
    }
  }

  async function handleImport() {
    if (!file) return;
    if (mode === "sessions" && !planId) {
      toast.error("Wybierz plan docelowy");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    if (mode === "sessions") formData.append("planId", planId);

    try {
      const res = await fetch("/api/training-plans/import", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(`Zaimportowano ${data.added} ${mode === "sessions" ? "sesji" : "ćwiczeń"}${data.skipped ? `, pominięto ${data.skipped}` : ""}`);
        onSaved();
      } else {
        toast.error(data.error || "Błąd importu");
      }
    } catch {
      toast.error("Błąd połączenia");
    } finally {
      setUploading(false);
    }
  }

  const columns = preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import z pliku</DialogTitle></DialogHeader>

        {/* Wybór trybu */}
        <div className="flex gap-1 border rounded-lg p-1 bg-muted">
          <button
            onClick={() => { setMode("sessions"); setFile(null); setPreview([]); setResult(null); }}
            className={cn("flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors", mode === "sessions" ? "bg-white shadow text-sky-700" : "text-muted-foreground")}
          >
            Sesje treningowe
          </button>
          <button
            onClick={() => { setMode("drills"); setFile(null); setPreview([]); setResult(null); }}
            className={cn("flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors", mode === "drills" ? "bg-white shadow text-sky-700" : "text-muted-foreground")}
          >
            Ćwiczenia (baza)
          </button>
        </div>

        {/* Plan docelowy (dla sesji) */}
        {mode === "sessions" && (
          <div className="space-y-1">
            <Label>Plan docelowy</Label>
            <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
              <SelectTrigger><SelectValue placeholder="Wybierz plan..." /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.category})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Oczekiwane kolumny */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-semibold mb-1">Oczekiwane kolumny w pliku:</p>
          {mode === "sessions" ? (
            <p>Tytuł (wymagane), Data, Czas (min), Cele, Plan / Notatki, Ćwiczenia</p>
          ) : (
            <p>Nazwa (wymagane), Kategoria (Jazda/Strzały/Podania/...), Opis, Czas (min), Sprzęt, Trudność (1-5), Grupy wiekowe</p>
          )}
        </div>

        {/* Upload pliku */}
        <div className="space-y-1">
          <Label>Plik (.xlsx lub .csv)</Label>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{file ? file.name : "Kliknij aby wybrać plik"}</span>
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
          </label>
        </div>

        {/* Podgląd */}
        {preview.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Podgląd ({preview.length} z {preview.length >= 10 ? "10+" : preview.length} wierszy)</p>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {columns.map((col) => (
                      <th key={col} className="px-2 py-1.5 text-left font-medium border-b">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {columns.map((col) => (
                        <td key={col} className="px-2 py-1 max-w-[200px] truncate">{String(row[col] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Wynik importu */}
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm font-medium text-emerald-800">
              Dodano: {result.added} {mode === "sessions" ? "sesji" : "ćwiczeń"}
              {result.skipped > 0 && <span className="text-amber-700"> · Pominięto: {result.skipped}</span>}
            </p>
            {result.warnings && result.warnings.length > 0 && (
              <div className="mt-2 text-xs text-amber-700">
                {result.warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
              </div>
            )}
          </div>
        )}

        {/* Przyciski */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Zamknij</Button>
          <Button onClick={handleImport} disabled={!file || uploading || (mode === "sessions" && !planId)}>
            {uploading ? "Importowanie..." : "Importuj"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
