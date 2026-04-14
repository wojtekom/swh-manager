"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, ShoppingBag, Trash2, Eye } from "lucide-react";
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

interface Catalog {
  id: string;
  name: string;
  supplier: string;
  description: string | null;
  status: string;
  opensAt: string | null;
  closesAt: string | null;
  createdAt: string;
  _count: { products: number; orders: number };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Szkic", color: "bg-gray-100 text-gray-700" },
  OPEN: { label: "Otwarty", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "Zamknięty", color: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Zrealizowany", color: "bg-blue-100 text-blue-700" },
};

export default function CatalogsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/catalogs");
      if (res.ok) setCatalogs(await res.json());
    } catch {
      toast.error("Błąd pobierania katalogów");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchData();
  }, [authStatus, router, fetchData]);

  async function handleDelete(id: string) {
    if (!confirm("Usunąć katalog i wszystkie produkty?")) return;
    const res = await fetch(`/api/catalogs/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usunięto"); fetchData(); }
    else toast.error("Błąd usuwania");
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/catalogs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Status zmieniony"); fetchData(); }
    else toast.error("Błąd");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Katalogi sprzętu</h1>
          <p className="text-muted-foreground">{catalogs.length} katalogów</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nowy katalog
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : catalogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak katalogów. Utwórz pierwszy katalog sprzętu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {catalogs.map((cat) => {
            const st = STATUS_MAP[cat.status] || STATUS_MAP.DRAFT;
            return (
              <Card key={cat.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{cat.name}</h3>
                        <Badge className={st.color}>{st.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Dostawca: <strong>{cat.supplier}</strong>
                        {" · "}{cat._count.products} produktów
                        {" · "}{cat._count.orders} zamówień
                      </p>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                      )}
                      {(cat.opensAt || cat.closesAt) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {cat.opensAt && `Od: ${new Date(cat.opensAt).toLocaleDateString("pl-PL")}`}
                          {cat.opensAt && cat.closesAt && " · "}
                          {cat.closesAt && `Do: ${new Date(cat.closesAt).toLocaleDateString("pl-PL")}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && (
                        <Select value={cat.status} onValueChange={(v) => v && handleStatusChange(cat.id, v)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_MAP).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Link href={`/dashboard/catalogs/${cat.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3.5 w-3.5 mr-1" /> Produkty
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
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

      <CreateCatalogDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={fetchData} />
    </div>
  );
}

function CreateCatalogDialog({
  open, onClose, onSaved,
}: {
  open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", supplier: "", description: "", opensAt: "", closesAt: "" });

  useEffect(() => {
    if (open) setForm({ name: "", supplier: "", description: "", opensAt: "", closesAt: "" });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/catalogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        opensAt: form.opensAt ? new Date(form.opensAt).toISOString() : null,
        closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
      }),
    });
    if (res.ok) { toast.success("Katalog utworzony"); onSaved(); onClose(); }
    else toast.error("Błąd tworzenia katalogu");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy katalog sprzętu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nazwa katalogu</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="np. CCM Kolekcja 2026" required />
          </div>
          <div className="space-y-1">
            <Label>Dostawca</Label>
            <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="np. Sport Rebel, CCM" required />
          </div>
          <div className="space-y-1">
            <Label>Opis (opcjonalnie)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Opis oferty..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Otwarcie zamówień</Label>
              <Input type="date" value={form.opensAt} onChange={(e) => setForm({ ...form, opensAt: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Zamknięcie zamówień</Label>
              <Input type="date" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Tworzenie..." : "Utwórz katalog"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
