"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ClipboardCheck, Trash2, PackageSearch, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const CATEGORY_MAP: Record<string, string> = {
  HELMET: "Kask", SKATES: "Łyżwy", ROLLER_SKATES: "Łyżworolki",
  STICK: "Kij", GLOVES: "Rękawice", PADS: "Ochraniacze",
  JERSEY: "Koszulka", PANTS: "Spodnie", BAG: "Torba",
  GOALIE_GEAR: "Sprzęt bramkarski", NECK_GUARD: "Ochraniacz szyi",
  MOUTHGUARD: "Ochraniacz na zęby", TRAINING_AID: "Pomoc treningowa",
  ACCESSORY: "Akcesorium", OTHER: "Inne",
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  LOW: { label: "Niski", color: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Średni", color: "bg-amber-100 text-amber-700" },
  HIGH: { label: "Wysoki", color: "bg-red-100 text-red-700" },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Oczekujące", color: "bg-amber-100 text-amber-700" },
  PROPOSED: { label: "Propozycja", color: "bg-purple-100 text-purple-700" },
  ACCEPTED: { label: "Zaakceptowane", color: "bg-emerald-100 text-emerald-700" },
  APPROVED: { label: "Zatwierdzone", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Odrzucone", color: "bg-red-100 text-red-700" },
  FULFILLED: { label: "Zrealizowane", color: "bg-blue-100 text-blue-700" },
};

interface Proposal {
  id: string;
  comment: string | null;
  isAccepted: boolean;
  createdAt: string;
  product: {
    id: string; name: string; brand: string; price: number;
    equipmentCategory: string; productCode: string | null;
    ageGroup: string | null; level: string | null;
    sizes: string[]; description: string | null;
    catalog: { id: string; name: string; supplier: string };
  };
  admin: { id: string; name: string };
}

interface EquipmentRequest {
  id: string;
  name: string;
  description: string | null;
  playerName: string | null;
  equipmentCategory: string;
  quantity: number;
  priority: string;
  status: string;
  minBudget: number | null;
  maxBudget: number | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string };
  proposals: Proposal[];
}

export default function EquipmentRequestsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";
  const isParent = session?.user?.role === "PARENT";
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/equipment-requests");
      if (res.ok) setRequests(await res.json());
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

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/equipment-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Status zmieniony"); fetchData(); }
    else toast.error("Błąd");
  }

  async function handleDelete(id: string) {
    if (!confirm("Usunąć zapotrzebowanie?")) return;
    const res = await fetch(`/api/equipment-requests/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usunięto"); fetchData(); }
    else toast.error("Błąd");
  }

  async function handleAccept(id: string) {
    const res = await fetch(`/api/equipment-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    if (res.ok) { toast.success("Propozycja zaakceptowana"); fetchData(); }
    else toast.error("Błąd");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Zapotrzebowanie na sprzęt</h1>
          <p className="text-muted-foreground">{requests.length} zgłoszeń</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nowe zapotrzebowanie
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isParent
                ? "Brak zapotrzebowań. Zgłoś potrzebny sprzęt dla swojego dziecka."
                : "Brak zapotrzebowań. Zgłoś potrzebny sprzęt treningowy."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const pr = PRIORITY_MAP[req.priority] || PRIORITY_MAP.MEDIUM;
            const st = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
            const isOwner = req.user.id === session?.user?.id;
            const canDelete = ((isOwner && req.status === "PENDING") || isAdmin);

            return (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{req.name}</p>
                        <Badge className={st.color}>{st.label}</Badge>
                        <Badge className={pr.color}>{pr.label}</Badge>
                        <Badge variant="outline">{CATEGORY_MAP[req.equipmentCategory]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ilość: <strong>{req.quantity}</strong>
                        {req.playerName && <> · Dla: <strong>{req.playerName}</strong></>}
                        {" · "}Zgłosił: {req.user.name}
                        {" · "}{new Date(req.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                      {(req.minBudget != null || req.maxBudget != null) && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Budżet: {req.minBudget != null ? `${req.minBudget} zł` : "—"}
                          {" – "}
                          {req.maxBudget != null ? `${req.maxBudget} zł` : "—"}
                        </p>
                      )}
                      {req.description && <p className="text-sm mt-1">{req.description}</p>}
                      {req.notes && <p className="text-xs text-muted-foreground mt-1">Uwagi: {req.notes}</p>}
                      {req.adminNotes && (
                        <p className="text-xs text-sky-600 mt-1">Odpowiedź admina: {req.adminNotes}</p>
                      )}

                      {/* Proposals section */}
                      {req.proposals && req.proposals.length > 0 && (
                        <div className="mt-3 border-t pt-3 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Propozycje produktów ({req.proposals.length})
                          </p>
                          {req.proposals.map((prop) => (
                            <div key={prop.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                              <PackageSearch className="h-4 w-4 mt-0.5 text-purple-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {prop.product.brand} {prop.product.name}
                                  {prop.product.price > 0 && (
                                    <span className="ml-2 text-green-600 font-semibold">
                                      {prop.product.price.toFixed(2)} zł
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {prop.product.catalog.name}
                                  {prop.product.ageGroup && ` · ${prop.product.ageGroup}`}
                                  {prop.product.level && ` · ${prop.product.level}`}
                                  {prop.product.sizes?.length > 0 && ` · Rozmiary: ${prop.product.sizes.join(", ")}`}
                                </p>
                                {prop.comment && (
                                  <p className="text-xs mt-0.5 text-sky-600">{prop.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Zaproponował: {prop.admin.name} · {new Date(prop.createdAt).toLocaleDateString("pl-PL")}
                                </p>
                              </div>
                              {isAdmin && (
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={async () => {
                                    const res = await fetch(`/api/equipment-requests/${req.id}/proposals?proposalId=${prop.id}`, { method: "DELETE" });
                                    if (res.ok) { toast.success("Usunięto propozycję"); fetchData(); }
                                    else toast.error("Błąd");
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {/* Parent accept button */}
                          {isParent && isOwner && req.status === "PROPOSED" && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" onClick={() => handleAccept(req.id)}>
                                <Check className="h-3.5 w-3.5 mr-1" /> Akceptuję propozycję
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(req.id, "REJECTED")}>
                                <XIcon className="h-3.5 w-3.5 mr-1" /> Odrzuć
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && (
                        <Button variant="outline" size="sm" onClick={() => setProposalOpen(req.id)}>
                          <PackageSearch className="h-3.5 w-3.5 mr-1" /> Zaproponuj
                        </Button>
                      )}
                      {isAdmin && (
                        <Select value={req.status} onValueChange={(v) => v && handleStatusChange(req.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_MAP).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(req.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchData}
        isParent={isParent}
      />

      {proposalOpen && (
        <ProposalDialog
          requestId={proposalOpen}
          onClose={() => setProposalOpen(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}

function CreateRequestDialog({
  open, onClose, onSaved, isParent,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; isParent: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", playerName: "",
    equipmentCategory: "OTHER", quantity: 1, priority: "MEDIUM",
    minBudget: "", maxBudget: "", notes: "",
  });

  useEffect(() => {
    if (open) setForm({
      name: "", description: "", playerName: "",
      equipmentCategory: "OTHER", quantity: 1, priority: "MEDIUM",
      minBudget: "", maxBudget: "", notes: "",
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      equipmentCategory: form.equipmentCategory,
      quantity: Number(form.quantity),
      priority: form.priority,
      notes: form.notes || undefined,
    };
    if (form.playerName) payload.playerName = form.playerName;
    if (form.minBudget) payload.minBudget = Number(form.minBudget);
    if (form.maxBudget) payload.maxBudget = Number(form.maxBudget);

    const res = await fetch("/api/equipment-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { toast.success("Zapotrzebowanie zgłoszone"); onSaved(); onClose(); }
    else toast.error("Błąd");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nowe zapotrzebowanie na sprzęt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nazwa / opis sprzętu</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="np. Łyżwy hokejowe Junior" required />
          </div>
          {isParent && (
            <div className="space-y-1">
              <Label>Imię dziecka</Label>
              <Input value={form.playerName} onChange={(e) => setForm({ ...form, playerName: e.target.value })} placeholder="np. Jan Kowalski" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Kategoria</Label>
              <Select value={form.equipmentCategory} onValueChange={(v) => v && setForm({ ...form, equipmentCategory: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priorytet</Label>
              <Select value={form.priority} onValueChange={(v) => v && setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Ilość</Label>
            <Input type="number" min={1} max={100} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Budżet min (zł)</Label>
              <Input type="number" min={0} step={1} value={form.minBudget} onChange={(e) => setForm({ ...form, minBudget: e.target.value })} placeholder="np. 200" />
            </div>
            <div className="space-y-1">
              <Label>Budżet max (zł)</Label>
              <Input type="number" min={0} step={1} value={form.maxBudget} onChange={(e) => setForm({ ...form, maxBudget: e.target.value })} placeholder="np. 500" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Opis (opcjonalnie)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Dodatkowe szczegóły..." />
          </div>
          <div className="space-y-1">
            <Label>Uwagi (opcjonalnie)</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="np. potrzebne na turniej 15.05" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Zgłaszanie..." : "Zgłoś zapotrzebowanie"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CatalogProduct {
  id: string; name: string; brand: string; price: number;
  equipmentCategory: string; ageGroup: string | null;
  level: string | null; sizes: string[];
}

interface Catalog {
  id: string; name: string; supplier: string;
}

function ProposalDialog({
  requestId, onClose, onSaved,
}: {
  requestId: string; onClose: () => void; onSaved: () => void;
}) {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/catalogs").then((r) => r.json()).then(setCatalogs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCatalog) { setProducts([]); return; }
    fetch(`/api/catalogs/${selectedCatalog}/products`)
      .then((r) => r.json()).then(setProducts).catch(() => {});
  }, [selectedCatalog]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
  });

  async function handleSubmit() {
    if (!selectedProduct) { toast.error("Wybierz produkt"); return; }
    setLoading(true);
    const res = await fetch(`/api/equipment-requests/${requestId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selectedProduct, comment: comment || undefined }),
    });
    if (res.ok) { toast.success("Propozycja dodana"); onSaved(); onClose(); }
    else toast.error("Błąd");
    setLoading(false);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zaproponuj produkt z katalogu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Katalog</Label>
            <Select value={selectedCatalog} onValueChange={(v) => { if (v) { setSelectedCatalog(v); setSelectedProduct(""); } }}>
              <SelectTrigger><SelectValue placeholder="Wybierz katalog..." /></SelectTrigger>
              <SelectContent>
                {catalogs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.supplier})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCatalog && (
            <>
              <div className="space-y-1">
                <Label>Szukaj produktu</Label>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtruj po nazwie lub marce..." />
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                {filtered.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground text-center">Brak produktów</p>
                ) : (
                  filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                        selectedProduct === p.id ? "bg-purple-50 border-l-2 border-purple-500" : ""
                      }`}
                      onClick={() => setSelectedProduct(p.id)}
                    >
                      <p className="text-sm font-medium">
                        {p.brand} {p.name}
                        {p.price > 0 && <span className="ml-2 text-green-600">{p.price.toFixed(2)} zł</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_MAP[p.equipmentCategory] || p.equipmentCategory}
                        {p.ageGroup && ` · ${p.ageGroup}`}
                        {p.level && ` · ${p.level}`}
                        {p.sizes?.length > 0 && ` · ${p.sizes.join(", ")}`}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label>Komentarz (opcjonalnie)</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="np. Polecam ten model, dobry stosunek ceny do jakości..." />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button onClick={handleSubmit} disabled={loading || !selectedProduct}>
              {loading ? "Dodawanie..." : "Zaproponuj produkt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
