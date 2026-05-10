"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bus,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Tent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPLN } from "@/lib/camp-signup-helpers";

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
  signupOpen?: boolean;
  signupDeadline?: string | null;
  priceAthleteBus?: number | null;
  priceAthleteOwn?: number | null;
  priceCompanionBus?: number | null;
  priceCompanionOwn?: number | null;
  _count?: { registrations: number };
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  CAMP: { label: "Obóz", color: "bg-green-100 text-green-700" },
  TRIP: { label: "Wyjazd", color: "bg-sky-100 text-sky-700" },
  WORKSHOP: { label: "Warsztaty", color: "bg-purple-100 text-purple-700" },
};

export default function WyjazdyListPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/camps");
      if (res.ok) {
        const data: Camp[] = await res.json();
        // Filtruj: tylko obozy z otwartym zapisem LUB kończące się w przyszłości
        const now = new Date();
        const filtered = data
          .filter((c) => new Date(c.endDate) >= now)
          .sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        setCamps(filtered);
      } else {
        toast.error("Błąd pobierania listy wyjazdów");
      }
    } catch {
      toast.error("Błąd sieci");
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
        <h1 className="text-2xl font-bold">Wyjazdy</h1>
        <p className="text-muted-foreground">
          Nadchodzące obozy i wyjazdy klubowe SWH. Po wysłaniu zgłoszenia
          otrzymasz e-mail z numerem konta i tytułem przelewu.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie…</p>
      ) : camps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Obecnie nie ma zaplanowanych wyjazdów.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {camps.map((camp) => {
            const typeInfo = TYPE_LABELS[camp.type] ?? TYPE_LABELS.CAMP;
            const deadline = camp.signupDeadline
              ? new Date(camp.signupDeadline)
              : null;
            const isPastDeadline = deadline ? new Date() > deadline : false;
            const isClosed = camp.signupOpen === false || isPastDeadline;
            const priceBus = camp.priceAthleteBus ?? camp.cost;
            const priceOwn = camp.priceAthleteOwn ?? camp.cost;

            return (
              <Card
                key={camp.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                        {camp.category && (
                          <Badge variant="outline">{camp.category}</Badge>
                        )}
                        {isClosed ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Zapisy zamknięte
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Zapisy otwarte
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg">{camp.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {camp.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(camp.startDate).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                      })}
                      {" – "}
                      {new Date(camp.endDate).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {camp._count?.registrations ?? 0}
                      {camp.maxSpots ? `/${camp.maxSpots}` : ""} zapisanych
                    </span>
                    {priceBus > 0 && (
                      <span className="text-sm">
                        Zawodnik:{" "}
                        <span className="font-medium">
                          {formatPLN(priceBus)}
                        </span>
                        {priceOwn !== priceBus && priceOwn > 0 && (
                          <>
                            {" "}/{" "}
                            <span className="font-medium">
                              {formatPLN(priceOwn)}
                            </span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {deadline && !isPastDeadline && (
                    <p className="text-xs text-muted-foreground">
                      Zapisy do{" "}
                      <strong>
                        {deadline.toLocaleDateString("pl-PL")} 23:59
                      </strong>
                    </p>
                  )}

                  <div className="pt-1">
                    <Link href={`/dashboard/wyjazdy/${camp.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <Bus className="h-3.5 w-3.5 mr-1" />
                        {isClosed ? "Zobacz szczegóły" : "Zapisz się"}
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
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
