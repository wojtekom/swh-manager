"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Catalog {
  id: string;
  name: string;
  supplier: string;
  description: string | null;
  status: string;
  opensAt: string | null;
  closesAt: string | null;
  _count: { products: number; orders: number };
}

export default function ShopPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/catalogs");
      if (res.ok) setCatalogs(await res.json());
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sklep sprzętu</h1>
        <p className="text-muted-foreground">Zamów sprzęt hokejowy przez stowarzyszenie w lepszych cenach</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : catalogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak dostępnych katalogów. Wróć później!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {catalogs.map((cat) => (
            <Link key={cat.id} href={`/dashboard/shop/${cat.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground">{cat.supplier}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 shrink-0">Otwarty</Badge>
                  </div>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground mt-2">{cat.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{cat._count.products} produktów</span>
                    {cat.closesAt && (
                      <span>Zamówienia do: {new Date(cat.closesAt).toLocaleDateString("pl-PL")}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
