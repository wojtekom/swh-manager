"use client";

import { useEffect, useState, useCallback, useMemo, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bus,
  Car,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  Save,
  X,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateFamilyTotal,
  formatPLN,
  type CampPricing,
  type TransportType,
} from "@/lib/camp-signup-helpers";

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
  priceAthleteBus: number | null;
  priceAthleteOwn: number | null;
  priceCompanionBus: number | null;
  priceCompanionOwn: number | null;
  signupOpen: boolean;
  signupDeadline: string | null;
  maxCompanionsPerFamily: number;
  bankAccount: string | null;
  bankAccountHolder: string | null;
  paymentTitleTemplate: string | null;
  depositAmount: number | null;
  depositDeadlineDays: number;
  fullPaymentDeadline: string | null;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  jerseyNum: number | null;
}

interface Registration {
  id: string;
  playerId: string;
  status: string;
  transportType: TransportType;
  totalCost: number | null;
}

interface FamilySignup {
  companionsCount: number;
  companionNames: string[];
  transportType: TransportType;
  notes: string | null;
}

export default function WyjazdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campId } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [camp, setCamp] = useState<Camp | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [familySignup, setFamilySignup] = useState<FamilySignup | null>(null);
  const [currentAthletes, setCurrentAthletes] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [response, setResponse] = useState<"YES" | "NO">("YES");
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [companionsCount, setCompanionsCount] = useState(0);
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [transportType, setTransportType] = useState<TransportType>("BUS");
  const [notes, setNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [campRes, signupRes] = await Promise.all([
        fetch(`/api/camps/${campId}`),
        fetch(`/api/camps/${campId}/parent-signup`),
      ]);
      if (!campRes.ok) {
        toast.error("Nie udało się pobrać obozu");
        return;
      }
      const campData = await campRes.json();
      setCamp(campData);

      if (signupRes.ok) {
        const data = await signupRes.json();
        setChildren(data.children ?? []);
        setRegistrations(data.registrations ?? []);
        setFamilySignup(data.familySignup);
        setCurrentAthletes(data.aggregate?.currentAthletes ?? 0);

        // Hydrate form state z istniejącego zapisu
        const activeRegs = (data.registrations as Registration[] | undefined)?.filter(
          (r) => r.status !== "CANCELLED"
        );
        if (activeRegs && activeRegs.length > 0) {
          setSelectedAthletes(activeRegs.map((r) => r.playerId));
          setResponse("YES");
        } else if (data.familySignup) {
          // Tylko family signup bez registracji = NO
          setResponse("NO");
        }
        if (data.familySignup) {
          setCompanionsCount(data.familySignup.companionsCount);
          setCompanionNames(data.familySignup.companionNames ?? []);
          setTransportType(data.familySignup.transportType);
          setNotes(data.familySignup.notes ?? "");
        }
      }
    } catch {
      toast.error("Błąd sieci");
    } finally {
      setLoading(false);
    }
  }, [campId]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchData();
  }, [authStatus, router, fetchData]);

  // Sync companion names array gdy zmienia się count
  useEffect(() => {
    setCompanionNames((prev) => {
      const next = [...prev];
      while (next.length < companionsCount) next.push("");
      return next.slice(0, companionsCount);
    });
  }, [companionsCount]);

  // Pricing helper
  const pricing: CampPricing | null = useMemo(() => {
    if (!camp) return null;
    return {
      priceAthleteBus: camp.priceAthleteBus,
      priceAthleteOwn: camp.priceAthleteOwn,
      priceCompanionBus: camp.priceCompanionBus,
      priceCompanionOwn: camp.priceCompanionOwn,
      cost: camp.cost,
    };
  }, [camp]);

  const totalCost = useMemo(() => {
    if (!pricing || response === "NO") return 0;
    return calculateFamilyTotal(
      pricing,
      selectedAthletes.length,
      companionsCount,
      transportType
    );
  }, [pricing, response, selectedAthletes.length, companionsCount, transportType]);

  const deadline = camp?.signupDeadline ? new Date(camp.signupDeadline) : null;
  const isPastDeadline = deadline ? new Date() > deadline : false;
  const isClosed = !!camp && (!camp.signupOpen || isPastDeadline);
  const availableSeats = camp?.maxSpots
    ? Math.max(0, camp.maxSpots - currentAthletes)
    : null;

  async function handleSubmit() {
    if (!camp) return;

    // Walidacja
    if (response === "YES") {
      if (selectedAthletes.length === 0) {
        toast.error("Wybierz co najmniej jednego zawodnika.");
        return;
      }
      if (companionsCount > 0 && companionNames.some((n) => n.trim().length < 2)) {
        toast.error("Uzupełnij imiona wszystkich towarzyszy.");
        return;
      }
      if (companionsCount > camp.maxCompanionsPerFamily) {
        toast.error(`Max ${camp.maxCompanionsPerFamily} towarzyszy na rodzinę.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/camps/${campId}/parent-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response,
          athleteIds: response === "YES" ? selectedAthletes : [],
          companionsCount: response === "YES" ? companionsCount : 0,
          companionNames:
            response === "YES" ? companionNames.map((n) => n.trim()) : [],
          transportType,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Błąd zapisu");
      } else {
        toast.success(
          response === "YES"
            ? "Zgłoszenie zapisane! Sprawdź mail z danymi do przelewu."
            : 'Zapisaliśmy Twoje "NIE". Dzięki za informację.'
        );
        await fetchData();
      }
    } catch {
      toast.error("Błąd sieci");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Anulować całe zgłoszenie?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/camps/${campId}/parent-signup`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Zgłoszenie anulowane");
        await fetchData();
      } else {
        toast.error("Błąd anulowania");
      }
    } catch {
      toast.error("Błąd sieci");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !camp || !pricing) {
    return (
      <p className="text-center text-muted-foreground py-8">Ładowanie…</p>
    );
  }

  const hasExistingSignup =
    registrations.some((r) => r.status !== "CANCELLED") || !!familySignup;

  const athleteUnitPrice =
    transportType === "BUS"
      ? pricing.priceAthleteBus ?? pricing.cost
      : pricing.priceAthleteOwn ?? pricing.cost;
  const companionUnitPrice =
    transportType === "BUS"
      ? pricing.priceCompanionBus ?? 0
      : pricing.priceCompanionOwn ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/dashboard/wyjazdy"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Wszystkie wyjazdy
      </Link>

      {/* Header obozu */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 flex-wrap">
            {camp.category && <Badge variant="outline">{camp.category}</Badge>}
            <Badge
              className={
                isClosed
                  ? "bg-gray-100 text-gray-700"
                  : "bg-blue-100 text-blue-700"
              }
            >
              {isClosed ? "Zapisy zamknięte" : "Zapisy otwarte"}
            </Badge>
          </div>
          <CardTitle className="text-2xl">{camp.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(camp.startDate).toLocaleDateString("pl-PL")} –{" "}
              {new Date(camp.endDate).toLocaleDateString("pl-PL")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {camp.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {currentAthletes}
              {camp.maxSpots ? `/${camp.maxSpots}` : ""} zapisanych
            </span>
          </div>

          {camp.description && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">
                Pełny opis i regulamin
              </summary>
              <div className="mt-3 prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">
                {camp.description}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Zamknięte */}
      {isClosed && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {isPastDeadline && deadline
                ? `Termin zapisów minął ${deadline.toLocaleDateString("pl-PL")}.`
                : "Zapisy na ten obóz są obecnie zamknięte."}
            </p>
            {hasExistingSignup && (
              <p className="text-sm mt-2">
                Twoje zgłoszenie pozostaje aktywne — szczegóły poniżej.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formularz */}
      {(!isClosed || hasExistingSignup) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {hasExistingSignup ? "Twoje zgłoszenie" : "Zapis na obóz"}
            </CardTitle>
            {availableSeats !== null && !isClosed && (
              <p className="text-sm text-muted-foreground">
                Wolne miejsca: <strong>{availableSeats}</strong> z{" "}
                {camp.maxSpots}
                {deadline && (
                  <>
                    {" · "}Zapisy do{" "}
                    <strong>
                      {deadline.toLocaleDateString("pl-PL")} 23:59
                    </strong>
                  </>
                )}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Decyzja */}
            <div className="space-y-2">
              <Label className="font-medium">Czy jedziecie?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResponse("YES")}
                  disabled={isClosed && !hasExistingSignup}
                  className={`px-3 py-2.5 rounded-md border text-sm font-medium transition ${
                    response === "YES"
                      ? "bg-green-50 border-green-400 text-green-800"
                      : "bg-background hover:bg-accent border-input"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  ✅ TAK, jedziemy
                </button>
                <button
                  type="button"
                  onClick={() => setResponse("NO")}
                  disabled={isClosed && !hasExistingSignup}
                  className={`px-3 py-2.5 rounded-md border text-sm font-medium transition ${
                    response === "NO"
                      ? "bg-red-50 border-red-400 text-red-800"
                      : "bg-background hover:bg-accent border-input"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  ❌ NIE jedziemy
                </button>
              </div>
            </div>

            {response === "YES" && (
              <>
                {/* Wybór dzieci */}
                <div className="space-y-2">
                  <Label className="font-medium">
                    Wybierz dzieci do zapisu
                  </Label>
                  {children.length === 0 ? (
                    <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                      <Info className="h-4 w-4 inline mr-1" />
                      Nie masz przypisanych dzieci-zawodników. Skontaktuj się z
                      zarządem (zarzadswh@halalodowa.siedlce.pl).
                    </div>
                  ) : (
                    <div className="space-y-1 border rounded-md p-1">
                      {children.map((child) => (
                        <label
                          key={child.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAthletes.includes(child.id)}
                            disabled={isClosed && !hasExistingSignup}
                            onChange={(e) =>
                              setSelectedAthletes((prev) =>
                                e.target.checked
                                  ? [...prev, child.id]
                                  : prev.filter((x) => x !== child.id)
                              )
                            }
                            className="h-4 w-4"
                          />
                          {child.jerseyNum && (
                            <span className="text-muted-foreground">
                              #{child.jerseyNum}
                            </span>
                          )}
                          <span className="flex-1">
                            {child.firstName} {child.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {child.category}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Liczba towarzyszy */}
                <div className="space-y-2">
                  <Label htmlFor="companions" className="font-medium">
                    Liczba towarzyszy
                  </Label>
                  <Input
                    id="companions"
                    type="number"
                    min={0}
                    max={camp.maxCompanionsPerFamily}
                    value={companionsCount}
                    disabled={isClosed && !hasExistingSignup}
                    onChange={(e) =>
                      setCompanionsCount(
                        Math.min(
                          camp.maxCompanionsPerFamily,
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="w-20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Rodzic / rodzeństwo nie-zawodnik. Max{" "}
                    {camp.maxCompanionsPerFamily} osób na rodzinę. Towarzysze
                    korzystają z noclegu i wyżywienia, ale nie z treningów na
                    lodzie.
                  </p>
                </div>

                {/* Imiona towarzyszy */}
                {companionsCount > 0 && (
                  <div className="space-y-2">
                    <Label className="font-medium">
                      Imiona i nazwiska towarzyszy
                    </Label>
                    {Array.from({ length: companionsCount }).map((_, i) => (
                      <Input
                        key={i}
                        placeholder={`Towarzysz ${i + 1}`}
                        value={companionNames[i] ?? ""}
                        disabled={isClosed && !hasExistingSignup}
                        onChange={(e) => {
                          const next = [...companionNames];
                          next[i] = e.target.value;
                          setCompanionNames(next);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Transport */}
                <div className="space-y-2">
                  <Label className="font-medium">Sposób transportu</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransportType("BUS")}
                      disabled={isClosed && !hasExistingSignup}
                      className={`px-3 py-2.5 rounded-md border text-sm font-medium transition flex items-center justify-center gap-2 ${
                        transportType === "BUS"
                          ? "bg-blue-50 border-blue-400 text-blue-800"
                          : "bg-background hover:bg-accent border-input"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Bus className="h-4 w-4" /> Autokar SWH
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransportType("OWN")}
                      disabled={isClosed && !hasExistingSignup}
                      className={`px-3 py-2.5 rounded-md border text-sm font-medium transition flex items-center justify-center gap-2 ${
                        transportType === "OWN"
                          ? "bg-blue-50 border-blue-400 text-blue-800"
                          : "bg-background hover:bg-accent border-input"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Car className="h-4 w-4" /> Własny transport
                    </button>
                  </div>
                </div>

                {/* Live calc */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Łączny koszt zgłoszenia
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    {formatPLN(totalCost)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedAthletes.length} zawodnik
                    {selectedAthletes.length !== 1 ? "ów" : ""} ×{" "}
                    {formatPLN(athleteUnitPrice)}
                    {companionsCount > 0 && (
                      <>
                        {" + "}
                        {companionsCount} towarzysz
                        {companionsCount !== 1 ? "y" : ""} ×{" "}
                        {formatPLN(companionUnitPrice)}
                      </>
                    )}
                  </p>
                </div>
              </>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="font-medium">
                Uwagi (opcjonalnie)
              </Label>
              <Textarea
                id="notes"
                rows={3}
                maxLength={500}
                value={notes}
                disabled={isClosed && !hasExistingSignup}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="np. alergie pokarmowe, leki, prośby specjalne…"
              />
            </div>

            {/* Akcje */}
            <div className="flex gap-2 justify-end pt-2">
              {hasExistingSignup && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting || (isClosed && !hasExistingSignup)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Anuluj zapis
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (isClosed && !hasExistingSignup) ||
                  (response === "YES" && children.length === 0)
                }
              >
                <Save className="h-4 w-4 mr-1" />
                {submitting
                  ? "Zapisywanie…"
                  : hasExistingSignup
                  ? "Zapisz zmiany"
                  : response === "YES"
                  ? `Zapisz zgłoszenie (${formatPLN(totalCost)})`
                  : 'Wyślij "NIE"'}
              </Button>
            </div>

            {response === "YES" && !hasExistingSignup && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                Po zapisaniu otrzymasz e-mail z numerem konta i tytułem
                przelewu.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
