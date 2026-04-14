"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Package, Upload, Check, X, FileSpreadsheet } from "lucide-react";
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
import Link from "next/link";

const CATEGORY_MAP: Record<string, string> = {
  HELMET: "Kask", SKATES: "Łyżwy", ROLLER_SKATES: "Łyżworolki",
  STICK: "Kij", GLOVES: "Rękawice", PADS: "Ochraniacze",
  JERSEY: "Koszulka", PANTS: "Spodnie", BAG: "Torba",
  GOALIE_GEAR: "Sprzęt bramkarski", NECK_GUARD: "Ochraniacz szyi",
  MOUTHGUARD: "Ochraniacz na zęby", TRAINING_AID: "Pomoc treningowa",
  ACCESSORY: "Akcesorium", OTHER: "Inne",
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  brand: string;
  equipmentCategory: string;
  price: number;
  imageUrl: string | null;
  sizes: string[];
  sizeChartUrl: string | null;
  isActive: boolean;
}

interface Catalog {
  id: string;
  name: string;
  supplier: string;
  description: string | null;
  status: string;
  products: Product[];
  _count: { orders: number };
}

export default function CatalogDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const catalogId = params.id as string;
  const isAdmin = session?.user?.role === "ADMIN";

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/catalogs/${catalogId}`);
      if (res.ok) setCatalog(await res.json());
      else toast.error("Nie znaleziono katalogu");
    } catch {
      toast.error("Błąd");
    } finally {
      setLoading(false);
    }
  }, [catalogId]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchData();
  }, [authStatus, router, fetchData]);

  async function handleDeleteProduct(productId: string) {
    if (!confirm("Usunąć produkt?")) return;
    const res = await fetch(`/api/catalogs/${catalogId}/products`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    // Fallback: deactivate
    if (!res.ok) {
      // Try PATCH to deactivate
    }
    fetchData();
  }

  if (loading) return <p className="text-center text-muted-foreground py-8">Ładowanie...</p>;
  if (!catalog) return <p className="text-center py-8">Nie znaleziono katalogu.</p>;

  // Group products by category
  const grouped = catalog.products.reduce((acc, p) => {
    const cat = p.equipmentCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/catalogs">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{catalog.name}</h1>
          <p className="text-muted-foreground">
            {catalog.supplier} · {catalog.products.length} produktów · {catalog._count.orders} zamówień
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Importuj ofertę
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Dodaj produkt
            </Button>
          </div>
        )}
      </div>

      {catalog.description && (
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{catalog.description}</p>
      )}

      {catalog.products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak produktów w katalogu. Dodaj pierwszy produkt.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, products]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-3">{CATEGORY_MAP[category] || category}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg bg-muted"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.brand}</p>
                          </div>
                          <p className="text-lg font-bold text-sky-600 shrink-0">
                            {product.price.toFixed(2)} zł
                          </p>
                        </div>
                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.sizes.map((size) => (
                            <Badge key={size} variant="outline" className="text-xs">{size}</Badge>
                          ))}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2 mt-2">
                            {product.sizeChartUrl && (
                              <a href={product.sizeChartUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline">
                                Tabela rozmiarów
                              </a>
                            )}
                            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <AddProductDialog open={addOpen} onClose={() => setAddOpen(false)} catalogId={catalogId} onSaved={fetchData} />
      <ImportOfferDialog open={importOpen} onClose={() => setImportOpen(false)} catalogId={catalogId} brand={catalog.supplier} onSaved={fetchData} />
    </div>
  );
}

function AddProductDialog({
  open, onClose, catalogId, onSaved,
}: {
  open: boolean; onClose: () => void; catalogId: string; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", brand: "", equipmentCategory: "HELMET",
    price: "", description: "", imageUrl: "", sizes: "", sizeChartUrl: "",
  });

  useEffect(() => {
    if (open) setForm({
      name: "", brand: "", equipmentCategory: "HELMET",
      price: "", description: "", imageUrl: "", sizes: "", sizeChartUrl: "",
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const sizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    if (sizes.length === 0) { toast.error("Podaj przynajmniej jeden rozmiar"); setLoading(false); return; }

    const res = await fetch(`/api/catalogs/${catalogId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        sizes,
        imageUrl: form.imageUrl || undefined,
        sizeChartUrl: form.sizeChartUrl || undefined,
      }),
    });
    if (res.ok) { toast.success("Produkt dodany"); onSaved(); onClose(); }
    else toast.error("Błąd dodawania produktu");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj produkt do katalogu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nazwa produktu</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="np. Kask Bauer Re-Akt 85" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Marka</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="CCM, Bauer..." required />
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Cena (PLN)</Label>
              <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="299.00" required />
            </div>
            <div className="space-y-1">
              <Label>Rozmiary (oddzielone przecinkiem)</Label>
              <Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Opis (opcjonalnie)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="space-y-1">
            <Label>URL zdjęcia (opcjonalnie)</Label>
            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label>URL tabeli rozmiarów (opcjonalnie)</Label>
            <Input value={form.sizeChartUrl} onChange={(e) => setForm({ ...form, sizeChartUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Dodawanie..." : "Dodaj produkt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Parser ofert ---

interface ParsedProduct {
  name: string;
  brand: string;
  equipmentCategory: string;
  price: number;
  sizes: string[];
  description: string;
  selected: boolean;
}

function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (/kask|helmet|head/i.test(t)) return "HELMET";
  if (/łyżw|skate|brus|rolk/i.test(t)) return "SKATES";
  if (/kij|stick|klucz/i.test(t)) return "STICK";
  if (/rękaw|glov/i.test(t)) return "GLOVES";
  if (/ochran|pad|shin|elbow|shoulder/i.test(t)) return "PADS";
  if (/koszul|jersey|sweat/i.test(t)) return "JERSEY";
  if (/spodni|pants|breez/i.test(t)) return "PANTS";
  if (/torb|bag|pleca/i.test(t)) return "BAG";
  if (/bramk|goali/i.test(t)) return "GOALIE_GEAR";
  return "OTHER";
}

function parsePrice(text: string): number {
  // Remove spaces within numbers
  const cleaned = text.replace(/(\d)\s+(\d)/g, "$1$2");
  // Match: 2100,0 or 2100.00 or 350,0 or 750 etc
  const match = cleaned.match(/(\d+)[,.](\d+)/) || cleaned.match(/(\d+)/);
  if (!match) return 0;
  if (match[2]) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }
  return parseInt(match[1]);
}

// Extract size from product name like "[04.0 D]" or "[08.0, REG]"
function extractSizeFromName(name: string): { baseName: string; size: string } | null {
  // Match patterns like [04.0 D], [08.0, REG], [07.5, REG]
  const bracketMatch = name.match(/\[(\d+\.?\d*)\s*[,]?\s*(\w*)\]/);
  if (bracketMatch) {
    const sizeNum = bracketMatch[1].replace(/^0+/, "") || "0"; // Remove leading zeros: 04.0 -> 4.0
    const width = bracketMatch[2] || "";
    const size = width ? `${sizeNum} ${width}` : sizeNum;
    const baseName = name.replace(/\s*\[.*?\]\s*/, "").trim();
    return { baseName, size };
  }
  // Match patterns like (S), (M), (L), (XL), (42), (7.5)
  const parenMatch = name.match(/\((\w+(?:\.\d)?)\)\s*$/);
  if (parenMatch) {
    const baseName = name.replace(/\s*\(.*?\)\s*$/, "").trim();
    return { baseName, size: parenMatch[1] };
  }
  return null;
}

function parseOfferText(text: string, defaultBrand: string): ParsedProduct[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Detect tab-separated format
  const tabLines = lines.filter(l => l.includes("\t"));
  const isTabFormat = tabLines.length > lines.length * 0.3;

  // Phase 1: Parse raw rows
  interface RawRow { name: string; price: number; code?: string; stock?: number; }
  const rows: RawRow[] = [];

  if (isTabFormat) {
    const firstLine = lines[0].toLowerCase();
    const hasHeader = /nazwa|name|produkt|product|cena|price|kod|code|stan/i.test(firstLine);
    const startIdx = hasHeader ? 1 : 0;

    let nameIdx = -1, priceIdx = -1, codeIdx = -1, stockIdx = -1;

    if (hasHeader) {
      const headers = lines[0].split("\t").map(h => h.toLowerCase().trim());
      headers.forEach((h, i) => {
        if (/nazwa|name|produkt|product|model/.test(h)) nameIdx = i;
        if (/cena|price|kwota/.test(h)) priceIdx = i;
        if (/kod|code|sku|indeks/.test(h)) codeIdx = i;
        if (/stan|stock|dost|ilo[sś][cć]|szt/.test(h)) stockIdx = i;
      });
    }

    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split("\t").map(c => c.trim());
      if (cols.length < 2) continue;

      // Auto-detect columns if not found from header
      if (nameIdx === -1) {
        // Name is the longest text column
        let maxLen = 0;
        cols.forEach((c, j) => { if (c.length > maxLen && !/^\d+[,.]?\d*$/.test(c.replace(/\s/g, ""))) { maxLen = c.length; nameIdx = j; } });
      }
      if (priceIdx === -1) {
        for (let j = 0; j < cols.length; j++) {
          if (j !== nameIdx && /^\d+[,.]?\d*$/.test(cols[j].replace(/\s/g, "")) && parsePrice(cols[j]) > 10) { priceIdx = j; break; }
        }
      }

      const name = nameIdx >= 0 ? cols[nameIdx] : "";
      if (!name || name.length < 3) continue;

      const price = priceIdx >= 0 ? parsePrice(cols[priceIdx]) : 0;
      const code = codeIdx >= 0 ? cols[codeIdx] : undefined;
      const stock = stockIdx >= 0 ? parseInt(cols[stockIdx]) : undefined;

      if (price <= 0) continue;

      rows.push({ name, price, code, stock });
    }
  } else {
    // Free text
    for (const line of lines) {
      if (/^[-=_*#]+$/.test(line) || line.length < 5) continue;
      if (/^(oferta|cennik|katalog|lista|lp|nr|kod|nazwa|cena|---)/i.test(line)) continue;

      const price = parsePrice(line);
      if (price <= 0) continue;

      // Extract name: text before price number
      const priceMatch = line.match(/(\d[\d\s,]*[\d])\s*(?:zł|PLN)?/i);
      let name = priceMatch ? line.substring(0, priceMatch.index).trim() : line;
      name = name.replace(/^[\d.)\-]+\s*/, "").replace(/\s*[-–—]\s*$/, "").trim();
      if (name.length < 3) continue;

      rows.push({ name, price });
    }
  }

  // Phase 2: Group rows by base product name (merge size variants)
  const grouped = new Map<string, { baseName: string; brand: string; category: string; price: number; sizes: string[]; stocks: number[] }>();

  for (const row of rows) {
    const extracted = extractSizeFromName(row.name);

    if (extracted) {
      // This row is a size variant — group it
      const key = `${extracted.baseName}__${row.price}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.sizes.push(extracted.size);
        if (row.stock !== undefined) existing.stocks.push(row.stock);
      } else {
        grouped.set(key, {
          baseName: extracted.baseName,
          brand: defaultBrand,
          category: guessCategory(extracted.baseName),
          price: row.price,
          sizes: [extracted.size],
          stocks: row.stock !== undefined ? [row.stock] : [],
        });
      }
    } else {
      // Standalone product
      grouped.set(`${row.name}__${row.price}__${Math.random()}`, {
        baseName: row.name,
        brand: defaultBrand,
        category: guessCategory(row.name),
        price: row.price,
        sizes: ["ONE SIZE"],
        stocks: row.stock !== undefined ? [row.stock] : [],
      });
    }
  }

  // Phase 3: Convert to ParsedProduct array
  const products: ParsedProduct[] = [];
  for (const g of grouped.values()) {
    const totalStock = g.stocks.length > 0 ? g.stocks.reduce((a, b) => a + b, 0) : 0;
    const stockInfo = g.stocks.length > 0 ? ` (${totalStock} szt. dostępnych)` : "";

    products.push({
      name: g.baseName,
      brand: g.brand,
      equipmentCategory: g.category,
      price: g.price,
      sizes: g.sizes,
      description: stockInfo.trim(),
      selected: true,
    });
  }

  return products;
}

function ImportOfferDialog({
  open, onClose, catalogId, brand, onSaved,
}: {
  open: boolean; onClose: () => void; catalogId: string; brand: string; onSaved: () => void;
}) {
  const [step, setStep] = useState<"paste" | "review">("paste");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [defaultBrand, setDefaultBrand] = useState(brand);

  useEffect(() => {
    if (open) {
      setStep("paste");
      setRawText("");
      setParsed([]);
      setDefaultBrand(brand);
    }
  }, [open, brand]);

  function handleParse() {
    const products = parseOfferText(rawText, defaultBrand);
    if (products.length === 0) {
      toast.error("Nie udało się rozpoznać produktów. Sprawdź format tekstu.");
      return;
    }
    setParsed(products);
    setStep("review");
    toast.success(`Rozpoznano ${products.length} produktów`);
  }

  function updateProduct(idx: number, field: keyof ParsedProduct, value: string | number | boolean | string[]) {
    setParsed(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  async function handleImport() {
    const selected = parsed.filter(p => p.selected && p.name && p.price > 0);
    if (selected.length === 0) { toast.error("Zaznacz przynajmniej jeden produkt"); return; }

    setSaving(true);
    const res = await fetch(`/api/catalogs/${catalogId}/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: selected.map(({ selected: _, ...p }) => ({
          ...p,
          sizes: p.sizes.length > 0 ? p.sizes : ["ONE SIZE"],
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(`Zaimportowano ${data.count} produktów`);
      onSaved();
      onClose();
    } else {
      toast.error("Błąd importu");
    }
    setSaving(false);
  }

  const selectedCount = parsed.filter(p => p.selected).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {step === "paste" ? "Importuj ofertę" : `Podgląd — ${parsed.length} produktów`}
          </DialogTitle>
        </DialogHeader>

        {step === "paste" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Wklej tekst oferty od handlowca — z maila, Excela lub PDF. System rozpozna produkty, ceny i rozmiary.</p>
              <p className="text-xs">Obsługiwane formaty: tabelka z Excela (kolumny oddzielone tabem), lista produktów z cenami, CSV.</p>
            </div>

            <div className="space-y-1">
              <Label>Domyślna marka</Label>
              <Input
                value={defaultBrand}
                onChange={e => setDefaultBrand(e.target.value)}
                placeholder="np. CCM, Bauer, Warrior"
              />
            </div>

            <div className="space-y-1">
              <Label>Treść oferty</Label>
              <Textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={14}
                placeholder={`Przykład 1 (z Excela - wklej tabelkę):\nNazwa\tCena\tRozmiary\nKask CCM Tacks 720\t599\tS, M, L, XL\nŁyżwy CCM JetSpeed FT6\t1899\t5, 6, 7, 8, 9\n\nPrzykład 2 (z maila):\nKask CCM Tacks 720 - 599 zł (S/M/L/XL)\nŁyżwy CCM JetSpeed FT6 - 1899 zł (rozmiary 5-9)\nRękawice CCM Tacks AS-V - 449 zł (10", 11", 12")`}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
              <Button onClick={handleParse} disabled={rawText.trim().length < 10}>
                Rozpoznaj produkty
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Zaznaczono <strong>{selectedCount}</strong> z {parsed.length} produktów do importu. Możesz edytować dane przed zapisem.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setStep("paste")}>
                Wróć do edycji tekstu
              </Button>
            </div>

            <div className="space-y-2">
              {parsed.map((product, idx) => (
                <Card key={idx} className={product.selected ? "" : "opacity-50"}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className={`mt-1 rounded-md border p-1 ${product.selected ? "bg-sky-500 text-white border-sky-500" : "border-gray-300"}`}
                        onClick={() => updateProduct(idx, "selected", !product.selected)}
                      >
                        {product.selected ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </button>
                      <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_100px_120px_100px_140px]">
                        <Input
                          value={product.name}
                          onChange={e => updateProduct(idx, "name", e.target.value)}
                          placeholder="Nazwa"
                          className="text-sm h-8"
                        />
                        <Input
                          value={product.brand}
                          onChange={e => updateProduct(idx, "brand", e.target.value)}
                          placeholder="Marka"
                          className="text-sm h-8"
                        />
                        <Select
                          value={product.equipmentCategory}
                          onValueChange={v => v && updateProduct(idx, "equipmentCategory", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={product.price}
                          onChange={e => updateProduct(idx, "price", Number(e.target.value))}
                          placeholder="Cena"
                          className="text-sm h-8"
                          min={0}
                          step="0.01"
                        />
                        <Input
                          value={product.sizes.join(", ")}
                          onChange={e => updateProduct(idx, "sizes", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                          placeholder="Rozmiary"
                          className="text-sm h-8"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
              <Button onClick={handleImport} disabled={saving || selectedCount === 0}>
                {saving ? "Importowanie..." : `Importuj ${selectedCount} produktów`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
