"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface OrderItem {
  id: string;
  size: string;
  quantity: number;
  unitPrice: number;
  product: { id: string; name: string; brand: string; equipmentCategory: string };
}

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
  catalog: { id: string; name: string; supplier: string };
  player: { id: string; firstName: string; lastName: string };
  user: { id: string; name: string };
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Wersja robocza", color: "bg-gray-100 text-gray-700" },
  SUBMITTED: { label: "Złożone", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Potwierdzone", color: "bg-blue-100 text-blue-700" },
  ORDERED: { label: "Zamówione", color: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Dostarczone", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Anulowane", color: "bg-red-100 text-red-700" },
};

export default function OrdersAdminPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchData = useCallback(async () => {
    try {
      const url = filterStatus === "ALL" ? "/api/orders" : `/api/orders?status=${filterStatus}`;
      const res = await fetch(url);
      if (res.ok) setOrders(await res.json());
    } catch {
      toast.error("Błąd");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchData();
  }, [authStatus, router, fetchData]);

  async function handleStatusChange(orderId: string, status: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Status zmieniony"); fetchData(); }
    else toast.error("Błąd");
  }

  function exportCSV() {
    const rows = [["Katalog", "Dostawca", "Rodzic", "Zawodnik", "Produkt", "Marka", "Rozmiar", "Ilość", "Cena jedn.", "Suma", "Status"]];
    orders.forEach((o) => {
      o.items.forEach((item) => {
        rows.push([
          o.catalog.name, o.catalog.supplier, o.user.name,
          `${o.player.firstName} ${o.player.lastName}`,
          item.product.name, item.product.brand, item.size,
          String(item.quantity), item.unitPrice.toFixed(2),
          (item.unitPrice * item.quantity).toFixed(2), STATUS_MAP[o.status]?.label || o.status,
        ]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zamowienia_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalValue = orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Zamówienia sprzętu</h1>
          <p className="text-muted-foreground">
            {orders.length} zamówień · Wartość: {totalValue.toFixed(2)} zł
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} disabled={orders.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak zamówień.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.SUBMITTED;
            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">
                          {order.player.firstName} {order.player.lastName}
                        </p>
                        <Badge className={st.color}>{st.label}</Badge>
                        <span className="text-lg font-bold text-sky-600">{order.totalPrice.toFixed(2)} zł</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Rodzic: {order.user.name} · Katalog: {order.catalog.name} ({order.catalog.supplier})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                      <div className="mt-2 space-y-1">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-sm">
                            {item.product.name} ({item.product.brand}) — rozmiar: <strong>{item.size}</strong> × {item.quantity} = {(item.unitPrice * item.quantity).toFixed(2)} zł
                          </p>
                        ))}
                      </div>
                    </div>
                    {session?.user?.role === "ADMIN" && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                      <Select value={order.status} onValueChange={(v) => v && handleStatusChange(order.id, v)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["CONFIRMED", "ORDERED", "DELIVERED", "CANCELLED"].map((s) => (
                            <SelectItem key={s} value={s}>{STATUS_MAP[s]?.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
