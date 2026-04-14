"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

interface Catalog {
  id: string;
  name: string;
  supplier: string;
  description: string | null;
  status: string;
  products: Product[];
}

interface CartItem {
  productId: string;
  product: Product;
  size: string;
  quantity: number;
}

interface Child {
  id: string;
  playerId: string;
  player: { id: string; firstName: string; lastName: string; category: string };
}

export default function ShopCatalogPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const catalogId = params.id as string;

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, childRes] = await Promise.all([
        fetch(`/api/catalogs/${catalogId}`),
        fetch("/api/parent/children"),
      ]);
      if (catRes.ok) setCatalog(await catRes.json());
      if (childRes.ok) {
        const data = await childRes.json();
        if (Array.isArray(data)) {
          setChildren(data);
          if (data.length === 1) setSelectedPlayer(data[0].player.id);
        }
      }
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

  function addToCart(product: Product, size: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.size === size);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { productId: product.id, product, size, quantity: 1 }];
    });
    toast.success(`${product.name} (${size}) dodano do koszyka`);
  }

  function updateQuantity(productId: string, size: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.size === size
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeFromCart(productId: string, size: string) {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  async function handleSubmit() {
    if (!selectedPlayer) { toast.error("Wybierz zawodnika"); return; }
    if (cart.length === 0) { toast.error("Koszyk jest pusty"); return; }

    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catalogId,
        playerId: selectedPlayer,
        items: cart.map((i) => ({
          productId: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
      }),
    });

    if (res.ok) {
      toast.success("Zamówienie złożone!");
      setCart([]);
      router.push("/dashboard/my-orders");
    } else {
      const data = await res.json();
      toast.error(data.error || "Błąd składania zamówienia");
    }
    setSubmitting(false);
  }

  if (loading) return <p className="text-center text-muted-foreground py-8">Ładowanie...</p>;
  if (!catalog) return <p className="text-center py-8">Nie znaleziono katalogu.</p>;

  const grouped = catalog.products.reduce((acc, p) => {
    const cat = p.equipmentCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/shop">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{catalog.name}</h1>
          <p className="text-muted-foreground">{catalog.supplier} · {catalog.products.length} produktów</p>
        </div>
      </div>

      {catalog.description && (
        <p className="text-sm bg-sky-50 rounded-lg p-3 text-sky-800">{catalog.description}</p>
      )}

      {/* Wybór zawodnika */}
      {children.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">Zamawiam dla:</span>
              {children.length === 1 ? (
                <span className="text-sm font-semibold">
                  {children[0].player.firstName} {children[0].player.lastName} ({children[0].player.category})
                </span>
              ) : (
                <Select value={selectedPlayer} onValueChange={(v) => v && setSelectedPlayer(v)}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Wybierz zawodnika" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.player.id} value={c.player.id}>
                        {c.player.firstName} {c.player.lastName} ({c.player.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {children.length === 0 && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Nie masz powiązanych zawodników.{" "}
              <Link href="/dashboard/players" className="text-sky-600 hover:underline">Powiąż dziecko</Link> aby móc zamawiać.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Produkty */}
      {Object.entries(grouped).map(([category, products]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-3">{CATEGORY_MAP[category] || category}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
        </div>
      ))}

      {/* Koszyk */}
      {cart.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/50 sticky bottom-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Koszyk ({cart.length} poz.) — {cartTotal.toFixed(2)} zł
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-muted-foreground ml-1">({item.size})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, item.size, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, item.size, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-medium w-20 text-right">{(item.product.price * item.quantity).toFixed(2)} zł</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.productId, item.size)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              className="w-full mt-3"
              disabled={submitting || !selectedPlayer}
              onClick={handleSubmit}
            >
              <Send className="h-4 w-4 mr-1" />
              {submitting ? "Wysyłanie..." : `Złóż zamówienie (${cartTotal.toFixed(2)} zł)`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product, size: string) => void }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg bg-muted" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.brand}</p>
              </div>
              <p className="text-lg font-bold text-sky-600 shrink-0">{product.price.toFixed(2)} zł</p>
            </div>
            {product.description && <p className="text-xs text-muted-foreground mt-1">{product.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Select value={selectedSize} onValueChange={(v) => v && setSelectedSize(v)}>
                <SelectTrigger className="h-8 w-[100px] text-xs">
                  <SelectValue placeholder="Rozmiar" />
                </SelectTrigger>
                <SelectContent>
                  {product.sizes.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => onAdd(product, selectedSize)} disabled={!selectedSize}>
                <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Dodaj
              </Button>
              {product.sizeChartUrl && (
                <a href={product.sizeChartUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline ml-auto">
                  Rozmiary
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
