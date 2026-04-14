"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface OrderItem {
  id: string;
  size: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; brand: string; equipmentCategory: string };
}

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  catalog: { name: string; supplier: string };
  player: { firstName: string; lastName: string };
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Wersja robocza", color: "bg-gray-100 text-gray-700" },
  SUBMITTED: { label: "Złożone", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Potwierdzone", color: "bg-blue-100 text-blue-700" },
  ORDERED: { label: "Zamówione u dostawcy", color: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Dostarczone", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Anulowane", color: "bg-red-100 text-red-700" },
};

export default function MyOrdersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
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

  async function handleCancel(orderId: string) {
    if (!confirm("Anulować zamówienie?")) return;
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) { toast.success("Zamówienie anulowane"); fetchData(); }
    else toast.error("Nie udało się anulować");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moje zamówienia</h1>
        <p className="text-muted-foreground">{orders.length} zamówień</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nie masz jeszcze zamówień.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = STATUS_MAP[order.status] || STATUS_MAP.SUBMITTED;
            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={st.color}>{st.label}</Badge>
                        <span className="text-lg font-bold text-sky-600">{order.totalPrice.toFixed(2)} zł</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.catalog.name} ({order.catalog.supplier}) · Dla: {order.player.firstName} {order.player.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                      <div className="mt-2 space-y-1">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-sm">
                            {item.product.name} ({item.product.brand}) — {item.size} × {item.quantity} = {(item.unitPrice * item.quantity).toFixed(2)} zł
                          </p>
                        ))}
                      </div>
                    </div>
                    {order.status === "SUBMITTED" && (
                      <Button variant="outline" size="sm" className="text-red-600 shrink-0" onClick={() => handleCancel(order.id)}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Anuluj
                      </Button>
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
