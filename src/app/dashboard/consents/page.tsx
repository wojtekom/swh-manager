"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const BANK_ACCOUNT = "56 1090 2688 0000 0001 6013 6130";

interface ConsentSection {
  id: string;
  title: string;
  content: string;
  checkLabel: string;
}

const CONSENTS: ConsentSection[] = [
  {
    id: "consentImage",
    title: "Zgoda na wykorzystanie wizerunku dziecka",
    content: `Wyrażam zgodę na nieodpłatne wykorzystanie wizerunku mojego dziecka przez Stowarzyszenie Wybieram Hokej w następującym zakresie:

- Wykonywanie zdjęć i nagrań video podczas treningów, zawodów i innych wydarzeń organizowanych przez Stowarzyszenie
- Publikowanie wizerunku na stronie internetowej Stowarzyszenia
- Publikowanie wizerunku w mediach społecznościowych (Facebook, Instagram, inne platformy)
- Wykorzystanie wizerunku w materiałach promocyjnych i informacyjnych Stowarzyszenia (plakaty, ulotki, prezentacje)
- Wykorzystanie wizerunku w kronikach i sprawozdaniach z działalności Stowarzyszenia

Niniejsza zgoda jest udzielana na czas uczestnictwa dziecka w zajęciach Stowarzyszenia Wybieram Hokej i może być cofnięta w każdym czasie poprzez złożenie pisemnego oświadczenia o cofnięciu zgody.

Oświadczam, że zostałem/am poinformowany/a o:
- Celu wykorzystania wizerunku dziecka (promocja działalności Stowarzyszenia)
- Prawie do cofnięcia zgody w dowolnym momencie
- Prawie żądania usunięcia wizerunku dziecka z publikacji
- Dobrowolności udzielenia zgody`,
    checkLabel: "Wyrażam zgodę na wykorzystanie wizerunku mojego dziecka",
  },
  {
    id: "consentTravel",
    title: "Zgoda na uczestnictwo w turniejach i meczach",
    content: `Wyrażam zgodę na uczestnictwo mojego dziecka w:

- Treningach hokeja na lodzie i na rolkach organizowanych przez Stowarzyszenie Wybieram Hokej
- Meczach i zawodach hokejowych rozgrywanych na terenie całego kraju
- Turniejach i sparingach organizowanych lub współorganizowanych przez Stowarzyszenie
- Wyjazdach na zawody na terenie Polski pod opieką kadry trenerskiej Stowarzyszenia
- Zgrupowaniach i obozach sportowych organizowanych przez Stowarzyszenie

Oświadczam, że:
- Zostałem/am poinformowany/a o zasadach bezpieczeństwa obowiązujących podczas treningów i zawodów
- Moje dziecko posiada wymagany sprzęt ochronny do uprawiania hokeja
- Wyrażam zgodę na transport mojego dziecka przez Stowarzyszenie na zawody i z powrotem
- Moje dziecko jest objęte ubezpieczeniem od następstw nieszczęśliwych wypadków
- W przypadku nagłej potrzeby wyrażam zgodę na udzielenie mojemu dziecku pierwszej pomocy`,
    checkLabel: "Wyrażam zgodę na uczestnictwo dziecka w turniejach i meczach wyjazdowych",
  },
  {
    id: "consentHealth",
    title: "Oświadczenie o stanie zdrowia dziecka",
    content: `Oświadczam, że:

1. Moje dziecko nie ma przeciwwskazań zdrowotnych do uprawiania hokeja na lodzie i hokeja na rolkach.

2. Moje dziecko posiada aktualne zaświadczenie lekarskie o braku przeciwwskazań do uprawiania sportu (hokej), wydane nie wcześniej niż 30 dni przed rozpoczęciem zajęć.

3. Zobowiązuję się do regularnego odnawiania zaświadczenia lekarskiego zgodnie z obowiązującymi przepisami (co najmniej raz w roku kalendarzowym).

Zobowiązuję się do niezwłocznego poinformowania kadry trenerskiej i zarządu Stowarzyszenia o wszelkich zmianach w stanie zdrowia mojego dziecka, które mogą mieć wpływ na bezpieczeństwo podczas treningów i zawodów.

Oświadczam, że jestem świadomy/a ryzyka związanego z uprawianiem sportu kontaktowego jakim jest hokej i nie będę kierował/a roszczeń wobec Stowarzyszenia Wybieram Hokej w przypadku kontuzji powstałych podczas treningów lub zawodów, pod warunkiem zachowania zasad bezpieczeństwa przez kadrę Stowarzyszenia.`,
    checkLabel: "Potwierdzam brak przeciwwskazań zdrowotnych do uprawiania hokeja",
  },
  {
    id: "consentGoodPractice",
    title: "Akceptacja Dobrych Praktyk i Regulaminu",
    content: `Oświadczam, że zapoznałem/am się z dokumentem "Dobre Praktyki - Praca z dziećmi w Stowarzyszeniu Wybieram Hokej" i akceptuję zawarte w nim zasady, w tym:

BEZPIECZEŃSTWO I OCHRONA DZIECI:
- Zero tolerancji dla przemocy fizycznej, psychicznej i werbalnej
- Przeciwdziałanie dyskryminacji ze względu na płeć, wiek, sprawność, pochodzenie
- Szacunek i równe traktowanie wszystkich uczestników zajęć
- Transparentność działań - rodzice mają prawo obserwować treningi

ORGANIZACJA TRENINGÓW:
- Warunkiem uczestnictwa jest wypełniona karta zgłoszenia wraz ze zgodami
- Aktualne zaświadczenie lekarskie o braku przeciwwskazań do uprawiania sportu
- Prowadzenie listy obecności na każdych zajęciach

KOMUNIKACJA:
- Regularne informowanie rodziców o postępach dzieci
- Terminowe powiadamianie o zmianach w harmonogramie zajęć
- Otwartość na pytania i sugestie rodziców

ZGŁASZANIE NIEPRAWIDŁOWOŚCI:
Każdy przypadek podejrzenia przemocy, dyskryminacji lub naruszenia praw dziecka powinien być niezwłocznie zgłoszony do Zarządu Stowarzyszenia.`,
    checkLabel: "Zapoznałem/am się z Dobrymi Praktykami i akceptuję regulamin",
  },
  {
    id: "consentData",
    title: "Zgoda na przetwarzanie danych osobowych (RODO)",
    content: `Wyrażam zgodę na przetwarzanie danych osobowych moich oraz mojego dziecka przez Stowarzyszenie Wybieram Hokej jako administratora danych, w następujących celach:

- Realizacja celów statutowych stowarzyszenia (organizacja treningów i zajęć hokejowych)
- Uczestnictwo w zawodach sportowych (rejestracja zawodników, zgłoszenia do rozgrywek)
- Kontakt z rodzicami (informowanie o zajęciach, zmianach w harmonogramie)
- Bezpieczeństwo dzieci (przechowywanie informacji o stanie zdrowia)

ZAKRES ZBIERANYCH DANYCH:
- Imię i nazwisko dziecka, data urodzenia
- Dane kontaktowe rodziców/opiekunów (imiona, nazwiska, telefony, e-maile)
- Informacje o stanie zdrowia (przeciwwskazania medyczne, alergie)

PRAWA RODZICA:
- Prawo dostępu do danych i ich sprostowania
- Prawo do usunięcia danych (prawo do bycia zapomnianym)
- Prawo do ograniczenia przetwarzania
- Prawo do przenoszenia danych
- Prawo wniesienia sprzeciwu
- Prawo do złożenia skargi do UODO

Czas przechowywania: przez okres członkostwa + 3 lata po jego zakończeniu.
Zgoda może być wycofana w każdym czasie.`,
    checkLabel: "Wyrażam zgodę na przetwarzanie danych osobowych (RODO)",
  },
];

export default function ConsentsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") {
      fetch("/api/consents")
        .then((r) => r.json())
        .then((data) => {
          if (data.allAccepted) setAlreadyAccepted(true);
        })
        .catch(() => {});
    }
  }, [authStatus, router]);

  const allChecked = CONSENTS.every((c) => checked[c.id]);

  async function handleSubmit() {
    if (!allChecked) { toast.error("Zaznacz wszystkie zgody"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentImage: true,
          consentTravel: true,
          consentHealth: true,
          consentGoodPractice: true,
          consentData: true,
        }),
      });
      if (res.ok) {
        toast.success("Zgody zaakceptowane!");
        router.push("/dashboard");
      } else {
        toast.error("Błąd zapisu");
      }
    } catch {
      toast.error("Błąd sieci");
    } finally {
      setLoading(false);
    }
  }

  if (alreadyAccepted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <ShieldCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Zgody zaakceptowane</h1>
        <p className="text-muted-foreground mb-6">Wszystkie wymagane dokumenty zostały zaakceptowane.</p>
        <Button onClick={() => router.push("/dashboard")}>Przejdź do aplikacji</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="text-center mb-8">
        <ShieldCheck className="h-12 w-12 text-sky-500 mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Wymagane zgody i oświadczenia</h1>
        <p className="text-muted-foreground mt-1">
          Stowarzyszenie Wybieram Hokej — Siedlce
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Przeczytaj i zaakceptuj poniższe dokumenty, aby korzystać z aplikacji.
        </p>
      </div>

      {/* Numer konta */}
      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="p-4">
          <p className="font-semibold text-sky-800">Numer konta bankowego Stowarzyszenia:</p>
          <p className="text-lg font-mono mt-1 text-sky-900 select-all">{BANK_ACCOUNT}</p>
          <p className="text-xs text-sky-600 mt-1">Stowarzyszenie Wybieram Hokej, Siedlce</p>
          <p className="text-xs text-sky-600">Tytuł przelewu: Składka + imię i nazwisko dziecka</p>
        </CardContent>
      </Card>

      {/* Zgody */}
      {CONSENTS.map((consent) => {
        const isExpanded = expanded[consent.id];
        const isChecked = checked[consent.id];

        return (
          <Card key={consent.id} className={isChecked ? "border-green-300 bg-green-50/30" : ""}>
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [consent.id]: !prev[consent.id] }))}
                className="w-full text-left p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isChecked ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {isChecked ? "\u2713" : ""}
                  </div>
                  <span className="font-semibold text-sm">{consent.title}</span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="bg-white border rounded-lg p-4 mb-3 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {consent.content}
                    </pre>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked || false}
                      onChange={(e) => setChecked((prev) => ({ ...prev, [consent.id]: e.target.checked }))}
                      className="mt-0.5 rounded border-gray-300 h-5 w-5"
                    />
                    <span className="text-sm font-medium">{consent.checkLabel}</span>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="text-center pt-4">
        <Button size="lg" onClick={handleSubmit} disabled={!allChecked || loading} className="px-8">
          <ShieldCheck className="h-5 w-5 mr-2" />
          {loading ? "Zapisywanie..." : "Akceptuję wszystkie zgody i oświadczenia"}
        </Button>
        {!allChecked && (
          <p className="text-xs text-muted-foreground mt-2">
            Rozwiń każdy dokument, przeczytaj i zaznacz checkbox
          </p>
        )}
      </div>
    </div>
  );
}
