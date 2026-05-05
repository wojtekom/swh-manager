/**
 * Seed: Plany treningowe SWH z treścią jednostek
 * 
 * Struktura:
 *   Program Roczny (YEARLY) per kategoria
 *     └─ Faza sezonowa (SEASONAL)
 *         └─ Tygodniowe sesje (TrainingSession) z pełną treścią
 *
 * Użycie:
 *   npx ts-node prisma/seed-training-plans.ts
 */

import { PrismaClient, AgeCategory, PlanType } from "@prisma/client";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// TREŚCI JEDNOSTEK TRENINGOWYCH
// ═══════════════════════════════════════════════════════════════

interface SessionDef {
  title: string;
  duration: number;
  objectives: string;
  notes: string;
  order: number;
  skillCodes?: string[]; // kody umiejętności Grutha ćwiczone w tej sesji (np. ["R1","R2","R8"])
}

interface PhaseDef {
  name: string;
  season: string;
  planType: PlanType;
  description: string;
  sessions: SessionDef[];
  startDate?: string; // YYYY-MM-DD — data pierwszej sesji w fazie
  dayPattern?: string; // "mon-thu" | "mon-thu-sat" — wzorzec dni treningowych
}

interface ProgramDef {
  name: string;
  category: AgeCategory;
  description: string;
  season: string;
  phases: PhaseDef[];
}

// ───────────────────────────────────────────────────────
// MIKRUS (U8) — 14 jednostek PZSW + sezon letni
// ───────────────────────────────────────────────────────
const MIKRUS_ROLKI: PhaseDef = {
  name: "Mikrus — Faza I: Oswojenie z rolkami",
  season: "roller-2026",
  planType: "SEASONAL",
  description: "Mezocykl 1: Oswojenie (kwiecień). Cel: bezpieczna jazda przodem, hamowanie, zabawa z krążkiem.",
  startDate: "2026-04-13",
  dayPattern: "mon-thu",
  sessions: [
    { title: "Oswojenie z rolkami — pierwsza jazda", duration: 60, order: 1,
      skillCodes: ["R1", "R2", "R8"],
      objectives: "Prawidłowa postawa (R1). Jazda przodem na dwóch nogach (R2). Bezpieczne hamowanie pługiem (R8).",
      notes: `ROZGRZEWKA (15 min):
• Marsz w rolkach na dywaniku/gumie — poczucie kółek
• 'Robot' — sztywne nogi, małe kroczki do przodu
• Gra: 'Zamrożony tag' — kto zostanie dotknięty, stoi w rozkroku, kolega przejeżdża pod ręką

CZĘŚĆ GŁÓWNA (25 min):
• Pozycja hokejowa — kolana ugięte, ręce do przodu, pokaz 'krzesełko'
• Jazda przodem — bałwanki (pompowanie na dwóch nogach)
• Hamowanie pługiem — 'robimy pizzę' (stopy do środka)
• Tor przeszkód prosty — pachołki co 3m, przejazd wolny, hamowanie na końcu

GRA (15 min):
• 'Zbieraj monety' — krążki rozrzucone po boisku, kto zbierze więcej (jazda + przysiady)
• Swobodna jazda z muzyką

ZAMKNIĘCIE (5 min):
• Krąg — każde dziecko mówi co mu się podobało
• Przybicie "żółwika" (pięść o pięść)` },

    { title: "Postawa i równowaga", duration: 60, order: 2,
      skillCodes: ["R1", "R2", "C1"],
      objectives: "Utrwalenie pozycji hokejowej (R1). Jazda na jednej nodze — ślizgi (R2). Wstawanie po upadku. Równowaga dynamiczna (C1).",
      notes: `ROZGRZEWKA (15 min):
• Jazda swobodna 3 min z muzyką
• "Samoloty" — jazda z rozłożonymi rękami, pochylanie na boki
• "Kaczuszki" — jazda w rzędzie za trenerem, naśladowanie ruchów

CZĘŚĆ GŁÓWNA (25 min):
• Ślizgi na dwóch nogach — popychanie się i jazda bez odpychania
• Ślizgi na jednej nodze — 'Flaming' (5 sek na prawej, 5 na lewej)
• Wstawanie po upadku — ćwiczone celowo: kolano → stopka → wstań (x5)
• Stacja: slalom między pachołkami (co 2m, wolne tempo)

GRA (15 min):
• 'Czerwone/zielone światło' — trener krzyczy kolor, dzieci jadą/hamują
• 'Wyścig żółwi' — kto dojedzie NAJWOLNIEJ do linii (kontrola prędkości)

ZAMKNIĘCIE (5 min):
• Pokaz — kto chce pokazać swój ulubiony element z dzisiejszych zajęć
• Oklask dla każdego występu` },

    { title: "Bałwanki i pierwsze crossovers", duration: 60, order: 3,
      skillCodes: ["R3", "R4", "K1"],
      objectives: "Jazda bałwankiem — pompowanie (R3). Wprowadzenie crossoverów w miejscu (R4). Jazda z kijem — trzymanie (K1).",
      notes: `ROZGRZEWKA (15 min):
• Jazda swobodna + 'statki kosmiczne' (dzieci wymijają się na boisku)
• 'Lustro' — dwójki, jeden jedzie, drugi naśladuje
• Rozciąganie dynamiczne z kijem (kij nad głową, skręty, wykroki)

CZĘŚĆ GŁÓWNA (25 min):
• Bałwanki — nogi razem/rozstaw/razem/rozstaw, tworząc kształt bałwana na podłodze
• Crossover w miejscu — stojąc, krzyżowanie lewej nogi nad prawą i odwrotnie
• Crossover w krążeniu — jazda w kółko wokół pachołka z przekładaniem nóg
• Jazda z kijem — trzymanie oburącz, prowadzenie piłki tenisowej (lekka, łatwiej niż krążek)

GRA (15 min):
• 'Pasterz i owieczki' — prowadzenie piłki kijem do "zagrody" (bramka)
• Mini mecz 3v3 — piłka tenisowa, bez bramkarza, bramki z pachołków

ZAMKNIĘCIE (5 min):
• 'Dziś nauczyłem się...' — każde dziecko kończy zdanie
• Zapowiedź: "Następnym razem gramy prawdziwym krążkiem!"` },

    { title: "Krążek i prowadzenie forehand", duration: 60, order: 4,
      skillCodes: ["K1", "K2", "S1", "S8"],
      objectives: "Trzymanie kija — chwyt (K1). Prowadzenie krążka forehand (K2). Strzał z miejsca forehand (S1). Celowanie dół bramki (S8).",
      notes: `ROZGRZEWKA (15 min):
• Bałwanki tam i z powrotem (4 × 20m)
• 'Złodziej krążków' — każdy ma krążek, pilnuje swojego i kradnie innym
• Rozgrzewka z kijem — kij jako przeszkoda (przeskoki, podskoki)

CZĘŚĆ GŁÓWNA (25 min):
• Chwyt kija — pokaz: ręka górna (kieruje), ręka dolna (siła). Sprawdzenie u każdego.
• Prowadzenie forehand — krążek przy łyżce, jazda do przodu wolno
• Prowadzenie w slalomie — pachołki co 2m, krążek forehand
• Strzał z miejsca — forehand, cel: bramka 3m. Pokaz transferu wagi z nogi tylnej na przednią.

GRA (15 min):
• 'Gol dnia' — każdy ma 3 strzały, trener komentuje najlepsze
• Mecz 3v3 — krążek rolkowy, bez bramkarza

ZAMKNIĘCIE (5 min):
• Strzały konkursowe — kto trafi w pachołek na bramce (zabawa)` },

    { title: "Hamowanie i zmiany kierunku", duration: 60, order: 5,
      skillCodes: ["R8", "R9", "K5", "K2"],
      objectives: "Hamowanie T-stop (R9). Szybkie starty. Zmiana kierunku z krążkiem. Prowadzenie z głową w górze (K5).",
      notes: `ROZGRZEWKA (15 min):
• Swobodna jazda z krążkiem — każdy prowadzi na boisku
• 'Bomba' — trener gwiżdże, wszyscy hamują w 3 sekundy (kto ostatni = pompki)
• Przysiady na rolkach, pajacyki (równowaga dynamiczna)

CZĘŚĆ GŁÓWNA (25 min):
• T-stop — pokaz: tylna noga prostopadła. Ćwiczenie: jazda 10m → T-stop na linii
• Szybki start — pozycja niska, 3 krótkie odpychania, sprint 10m (x4)
• Zmiana kierunku — jazda do pachołka, okrążenie, powrót. Z krążkiem.
• Slalom z krążkiem + strzał na końcu — łączymy prowadzenie + strzelanie

GRA (15 min):
• "Wyścig z przeszkodami" — slalom → tunel (pod kijem) → strzał
• Mecz 3v3 z regułą: "gol liczy się po min. 1 podaniu"

ZAMKNIĘCIE (5 min):
• Rozciąganie razem w kole. Zapowiedź: "Następnym razem TEST ROLKARZA — mierzymy wasze super moce!"` },

    { title: "TEST ROLKARZA — pomiar wstępny (T1-T6)", duration: 60, order: 6,
      skillCodes: ["R1","R2","R5","K2","P4","C4"],
      objectives: "Pomiar bazowy 6 parametrów: sprint 20m, slalom, jazda tyłem 15m, podanie celne ×5, prowadzenie krążka slalom, wytrzymałość kursowanie 240m.",
      notes: `ROZGRZEWKA (12 min):
• Marsz → trucht → boczne przeskoki → wykroki → krążenie ramion (po 30s)
• Swobodna jazda 3 min
• Trener pokazuje każdy tor testowy — dzieci przejeżdżają raz WOLNO (oswojenie)
• KOMUNIKAT: "To NIE konkurs. Każdy mierzy swój własny poziom. Za 2 miesiące zobaczycie różnicę."

TESTY (36 min — 6 min na test):
• T1 Sprint 20m — start na gwizdek, 2 próby, lepszy wynik
• T2 Slalom 6 pachołków co 1.5m — tam i z powrotem, 2 próby
• T3 Jazda tyłem 15m — start z linii, 2 próby
• T4 Podanie celne — 5 prób do bramki z 4m (forehand), liczymy trafienia
• T5 Prowadzenie krążka slalom — 6 pachołków, krążek forehand, 2 próby
• T6 Kursowanie wytrzymałościowe 4×60m (240m) — jeden czas

GRA (7 min):
• Swobodna gra 3v3 — 'nagroda' po testach

ZAMKNIĘCIE (5 min):
• "Wyniki są wasze — za 2 miesiące zrobimy to samo i zobaczycie ile urosliście"
• Przybicie piątek` },

    { title: "Jazda tyłem — wprowadzenie", duration: 60, order: 7,
      skillCodes: ["R5","R6","K3","O2"],
      objectives: "Jazda tyłem na dwóch nogach (R5). Bałwanki tyłem (R6). Cofanie z krążkiem backhand (K3). Obrona 1v1 (O2).",
      notes: `ROZGRZEWKA (15 min):
• Bałwanki przodem (rozgrzewka nóg)
• 'Cień' — dwójki: jeden jedzie przodem, drugi tyłem (twarzą do kolegi)
• Gra: 'Lustro tyłem' — trener jedzie tyłem, dzieci kopiują

CZĘŚĆ GŁÓWNA (25 min):
• Jazda tyłem — ślizgi na dwóch nogach (odpychanie od bandy, jazda tyłem do pachołka)
• Bałwanki tyłem — ciężar na piętach, małe ruchy na boki
• C-cut tyłem — pchnięcie jedną nogą, ślizg na drugiej
• Cofanie z krążkiem — prowadzenie backhand jadąc do tyłu (wolno!)

GRA (15 min):
• 'Obrońca' — obrońca jedzie tyłem, napastnik przodem, 1v1 do bramki
• Mecz 3v3 z zasadą: obrońca MUSI cofać się tyłem (ćwiczenie w grze)

ZAMKNIĘCIE (5 min):
• Pokaz umiejętności — "kto pokaże najdłuższy ślizg tyłem"` },
  ],
};

const MIKRUS_ROLKI_2: PhaseDef = {
  name: "Mikrus — Faza II: Podstawy techniczne",
  season: "roller-2026",
  planType: "SEASONAL",
  description: "Mezocykl 2: Podstawy techniczne (maj). Cel: crossovers, podania, strzał w ruchu.",
  startDate: "2026-05-07",
  dayPattern: "mon-thu",
  sessions: [
    { title: "Crossovers — jazda w łuku", duration: 60, order: 8,
      skillCodes: ["R4","K2","K5"],
      objectives: "Crossover przód (R4). Jazda w łuku w obie strony. Prowadzenie krążka z crossoverem (K2, K5).",
      notes: `ROZGRZEWKA (15 min):
• Jazda swobodna po obwodzie boiska (2 min na stronę)
• "Osiem" — jazda w kształcie ósemki wokół 2 pachołków
• Rozciąganie dynamiczne

CZĘŚĆ GŁÓWNA (25 min):
• Crossover w miejscu — powtórzenie z zajęć 3 (krzyżowanie nóg stojąc)
• Crossover w łuku — jazda wokół koła centralnego, lewa noga nad prawą (3 okrążenia na stronę)
• Korekta indywidualna — trener przy każdym dziecku 30s
• Crossover z krążkiem — jazda wokół koła z prowadzeniem forehand

GRA (15 min):
• 'Tornado' — wszyscy jadą w jednym kierunku po kole, na gwizdek zmiana kierunku
• Mecz 3v3 z bramkami przy bandzie (wymusza crossovers na zakrętach)

ZAMKNIĘCIE (5 min):
• Strzały konkursowe z łuku (po crossoverze)` },

    { title: "Podania — forehand po podłożu", duration: 60, order: 9,
      skillCodes: ["P1","P3","P5","K8"],
      objectives: "Podanie forehand po podłożu (P1). Przyjęcie podania — cushioning (P3, K8). Podanie w ruchu (P5).",
      notes: `ROZGRZEWKA (15 min):
• Dwójki: podanie do siebie stojąc (forehand-forehand) — 2 min
• Jazda swobodna z podawaniem piłki tenisowej w parach
• "Telefon" — 4 osoby w rzędzie, podanie z jednego końca na drugi, kto szybciej

CZĘŚĆ GŁÓWNA (25 min):
• Podanie forehand — pokaz: waga z nogi tylnej na przednią, łyżka kieruje krążek
• Przyjęcie — "miękkie ręce": łyżka amortyzuje krążek (cushioning)
• Podanie w dwójkach w miejscu — forehand, 3m odległość
• Podanie w ruchu — dwójki jadą obok siebie, podają co 5m

GRA (15 min):
• 'Gorący kartofel' — koło, podawanie krążka, na gwizdek kto ma = 5 bałwanków
• Mecz 3v3 — gol liczy się TYLKO po podaniu (wymusza współpracę)

ZAMKNIĘCIE (5 min):
• Konkurs: najdłuższe celne podanie (od linii do partnera)` },

    { title: "Strzał w ruchu + gra zespołowa", duration: 60, order: 10,
      skillCodes: ["S1","S2","S6","P1","A1"],
      objectives: "Strzał nadgarstkowy w ruchu (S2). Dobijanie (S6). Podanie + strzał (P1). Szukanie wolnych lodów (A1).",
      notes: `ROZGRZEWKA (15 min):
• Prowadzenie krążka — slalom 6 pachołków + strzał (każdy 3 razy)
• "Policjant" — jeden goni, reszta ucieka z krążkami

CZĘŚĆ GŁÓWNA (25 min):
• Strzał z miejsca — powtórzenie: waga, pozycja kija, cel (dół bramki)
• Strzał w ruchu — jazda prosto 10m → strzał forehand z 5m od bramki
• Stacja: jazda → podanie do ściany → strzał z dobitki
• Prowadzenie + podanie + strzał — trójki: A prowadzi, podaje do B, B strzela

GRA (15 min):
• Mecz 3v3 pełny — 3 min okresy, rotacja składów
• Reguła: gol z podania = 2 punkty (zachęta do gry zespołowej)

ZAMKNIĘCIE (5 min):
• 'MVP dnia' — dzieci głosują kto grał najbardziej zespołowo` },

    { title: "Cofanie + obrona 1-na-1", duration: 60, order: 11,
      skillCodes: ["R7","O1","O2","O3","O4"],
      objectives: "Crossover tyłem (R7). Gap control (O1). Jazda tyłem 1v1 (O2). Kij aktywny (O3). Poke check (O4).",
      notes: `ROZGRZEWKA (15 min):
• Bałwanki tyłem (4 × 15m)
• 'Cień' — A jedzie przodem z krążkiem, B tyłem twarzą do A
• Rozciąganie + wzmacnianie: deski 30s × 3

CZĘŚĆ GŁÓWNA (25 min):
• Jazda tyłem crossover — wokół koła (oba kierunki)
• Gap control — obrońca cofa się, utrzymując odległość 2-3m od napastnika
• Poke check — kij do przodu, wybijanie krążka (pokaz + ćwiczenie w parach)
• 1v1 z cofaniem — napastnik próbuje minąć, obrońca cofa się i broni

GRA (15 min):
• Mecz 3v3 z wyznaczonym obrońcą (rotacja co 2 min)

ZAMKNIĘCIE (5 min):
• "Najlepsza obrona dnia" — trener wskazuje i tłumaczy dlaczego` },

    { title: "Taktyka — give-and-go, gra na wolne lody", duration: 60, order: 12,
      skillCodes: ["A1","A2","A4","P5","P9"],
      objectives: "Give-and-go (A2). Szukanie wolnej przestrzeni (A1). Wejście do strefy carry-in (A4). Podanie w ruchu (P5). Podanie na wolne (P9).",
      notes: `ROZGRZEWKA (15 min):
• Podania w trójkach w ruchu (trójkąt, jazda do przodu)
• 'Magnes' — jazda swobodna, na gwizdek zbierz się w trójkę jak najszybciej

CZĘŚĆ GŁÓWNA (25 min):
• Give-and-go — A podaje do B, natychmiast rusza do przodu, B oddaje, A strzela
• "Wolne lody" — pokaz: gdzie jest wolna przestrzeń? Ćwiczenie: 2v1 w strefie
• Wejście do strefy — prowadzenie i podanie na skrzydło, strzał z pozycji
• Symulacja turnieju — 2 min okresy, 3v3 z formacjami kolorowymi

GRA (15 min):
• Mini turniej — 3 drużyny × 2 mecze × 4 min

ZAMKNIĘCIE (5 min):
• Omówienie turnieju — "co zadziałało, co nie"
• Zapowiedź: "Za 2 tygodnie PRAWDZIWY turniej!"` },

    { title: "Przygotowanie do turnieju — scrimmage", duration: 60, order: 13,
      skillCodes: ["R1","R2","R5","K2","P1","S1","C4"],
      objectives: "Symulacja meczowa. Test Rolkarza powtórzony (T1-T6). Pomiar postępu we wszystkich parametrach.",
      notes: `ROZGRZEWKA (10 min):
• Jazda swobodna z krążkiem
• Strzały na bramkę — forehand, 5 prób na rozgrzanie

TESTY POWTÓRKOWE (20 min):
• T1-T6 — identyczne jak na zaj. 6, ale szybciej bo dzieci już znają tory
• Komunikat: "Porównajcie ze swoim wynikiem sprzed 2 miesięcy!"

MECZ (25 min):
• Turniej 3v3 — 3 drużyny × 2 mecze × 5 min
• Trener zarządza zmianami per kolor (formacje kolorowe HLH)
• Punktacja: gol = 1 pkt, gol z podania = 2 pkt

ZAMKNIĘCIE (5 min):
• Porównanie wyników testów — każde dziecko słyszy swój postęp
• "Brawo, urosliście!" — dyplomy za sezon rolek` },

    { title: "Turniej końcowy + zakończenie sezonu rolkowego", duration: 60, order: 14,
      skillCodes: ["A1","A2","P1","S1","O1"],
      objectives: "Turniej rywalizacyjny. Gra zespołowa w praktyce (A1, A2, P1, S1, O1). Ceremonia zakończenia.",
      notes: `ROZGRZEWKA (10 min):
• Jazda swobodna + gra 'Zbieraj monety' (jak na zaj. 1 — porównanie)
• Rozgrzewka z muzyką

TURNIEJ (40 min):
• 3 drużyny kolorowe × round robin (2 mecze każda)
• Mecz 3v3, 2 × 5 min, przerwy 2 min
• Trener sędziuje, asystent notuje wyniki
• Fair play: trener podkreśla dobre zagrania (nie tylko gole)

ZAKOŃCZENIE (10 min):
• Zbiórka w kole — każde dziecko mówi 'mój najlepszy moment sezonu'
• Dyplomy za sezon rolkowy (imienne)
• Klasyfikacja: podkreślamy POSTĘP nie wynik
• Zdjęcie grupowe
• Informacja: "We wrześniu wracamy na rolki, a w grudniu na LÓD!"` },
  ],
};

// ───────────────────────────────────────────────────────
// LETNI KONSPEKT (czerwiec-sierpień) — wspólny dla grup
// ───────────────────────────────────────────────────────
const LETNI_BAZA: PhaseDef = {
  name: "Sezon letni — Blok I: Baza",
  season: "summer-2026",
  planType: "MONTHLY",
  description: "Mezocykl czerwiec (tyg. 1-4). Ogólnorozwojowy + wytrzymałość tlenowa. Ekstensywny charakter.",
  startDate: "2026-06-01",
  dayPattern: "mon-thu-sat",
  sessions: [
    { title: "Tydzień 1 — Pn: Ogólnorozwojowy + rolki", duration: 90, order: 1,
      skillCodes: ["R1","R2","R3","R4","K2","K3","C1","C2","C3"],
      objectives: "Koordynacja (C2), siła funkcjonalna (C1, C3). Pozycja hokejowa (R1), bałwanki (R3), crossovers (R4), prowadzenie F/B (K2, K3).",
      notes: `ROZGRZEWKA (20 min):
• Trucht 5 min + mobilność dynamiczna (biodra, barki, kolana)
• Koordynacja: drabinka koordynacyjna — 6 wzorców (naprzemienny, boczny, karaoke, pajacyk, double-step, ickey shuffle)

BLOK SIŁOWY (25 min):
• Obwód: pompki × 10, przysiady × 15, deski 30s, wykroki × 10/nogę, superman 30s, burpees × 8
• 3 rundy, przerwa 60s między rundami
• Nacisk na poprawną technikę — trener koryguje indywidualnie

BLOK ROLKOWY (35 min):
• Jazda swobodna 5 min (przypomnienie po przerwie)
• Pozycja hokejowa — korekta: kolana, plecy, głowa w górze
• Bałwanki 4 × 20m + crossovers 4 × koło
• Prowadzenie krążka forehand/backhand — slalom wolny
• Gra 3v3 swobodna 10 min

SCHŁADZANIE (10 min):
• Trucht lekki 3 min + stretching statyczny (kwadricepsy, dwugłowe, łydki, barki)` },

    { title: "Tydzień 1 — Czw: Wytrzymałość tlenowa + technika kija", duration: 90, order: 2,
      skillCodes: ["P1","P3","K8","S1","S2","C4"],
      objectives: "Wytrzymałość tlenowa fartlek (C4). Podanie forehand (P1), przyjęcie (P3, K8). Strzał wrist z miejsca i w ruchu (S1, S2).",
      notes: `ROZGRZEWKA (15 min):
• Trucht 5 min + rozciąganie dynamiczne
• ABC biegowe: skip A, skip C, kolana do klatki, pięty do pośladków

WYTRZYMAŁOŚĆ (25 min):
• Fartlek: 20 min biegu ciągłego z akceleracjami:
  - 3 min spokojny trucht, 1 min szybki bieg, 30s sprint
  - Powtórz 4 razy
• Strefa tętna: 130-160 bpm (rozmówka = za wolno, nie możesz mówić = za szybko)

TECHNIKA KIJA (20 min):
• Podania forehand w parach — stojąc (3 min), w ruchu (5 min)
• Przyjęcie podania — cushioning (miękkie ręce)
• Strzał nadgarstkowy z miejsca — 10 powtórzeń na cel
• Strzał w ruchu — jazda 10m → strzał z 5m

GRA (20 min):
• Mecz 4v4 na małym boisku — wymusza szybkie podania

SCHŁADZANIE (10 min):
• Stretching + omówienie` },

    { title: "Tydzień 1 — Sb: Sala / siłownia", duration: 60, order: 3,
      skillCodes: ["C1","C3","C5"],
      objectives: "Plyometria (C3). Wzorce ruchowe — przysiady, martwy ciąg, wiosłowanie (C1). Core stability (C5).",
      notes: `ROZGRZEWKA (15 min):
• Trucht + mobilność + ABC biegowe

PLYOMETRIA (20 min):
• Skoki na skrzynkę (box jumps) × 8 × 3 serie
• Skoki boczne nad ławeczką × 10 × 3
• Skipping z wyskokiem × 5/nogę × 3
• Przerwa 90s między seriami

WZORCE RUCHOWE (15 min):
• Przysiady goblet × 10 × 3 (kettlebell/piłka lekarska)
• Martwy ciąg na jednej nodze × 8/nogę × 3
• Wiosłowanie TRX × 10 × 3

CORE (10 min):
• Deska 45s × 3, deska boczna 30s × 2/stronę
• Hollow body hold 30s × 3
• Dead bug 10/stronę × 2` },

    { title: "Tydzień 2 — Pn: Wytrzymałość + crossovers", duration: 90, order: 4,
      skillCodes: ["R4","R7","K2","K3","C4"],
      objectives: "Wytrzymałość tlenowa 25 min (C4). Crossover przód (R4) i tył (R7). Prowadzenie F/B w ósemce (K2, K3).",
      notes: `ROZGRZEWKA (15 min):
• Trucht + mobilność
• Drabinka koordynacyjna — 4 nowe wzorce

WYTRZYMAŁOŚĆ (25 min):
• Bieg ciągły 25 min w strefie tlenowej (rozmówka OK)
• Trasa: park lub boisko — nawierzchnia miękka preferowana

ROLKI — CROSSOVERS (40 min):
• Crossover przód — wokół koła, 5 okrążeń na stronę
• Crossover tył — wokół koła, 3 okrążeń na stronę (wolniej!)
• Crossover z krążkiem — slalom szeroki z przekładaniem nóg
• Prowadzenie krążka forehand/backhand w "ósemce"
• Gra 3v3 z bramkami na rogach (wymusza crossovers)

SCHŁADZANIE (10 min):
• Stretching` },
  ],
};

const LETNI_BUDOWA: PhaseDef = {
  name: "Sezon letni — Blok II: Budowa",
  season: "summer-2026",
  planType: "MONTHLY",
  description: "Mezocykl lipiec (tyg. 5-8). Szybkość + siła funkcjonalna. Interwały, eksplozywność. Technika kija z puck handlingiem.",
  startDate: "2026-07-06",
  dayPattern: "mon-thu-sat",
  sessions: [
    { title: "Tydzień 5 — Pn: Interwały + szybkość na rolkach", duration: 90, order: 1,
      skillCodes: ["R10","K5","K10","C3","C4"],
      objectives: "Interwały anaerobowe (C4). Starty eksplozywne — hockey stop (R10). Szybkość z krążkiem (K10). Prowadzenie z głową (K5). Zwinność (C3).",
      notes: `ROZGRZEWKA (15 min):
• Trucht 5 min + mobilność + aktywacja (przysiady z wyskokiem × 5)

INTERWAŁY (25 min):
• Shuttle run: 5-10-5m × 6 powtórzeń, przerwa 90s
• Sprint 20m × 4, przerwa 60s
• 'Hokejowe piątki': 30s max wysiłek, 2.5 min przerwa × 5

ROLKI — SZYBKOŚĆ (30 min):
• Starty eksplozywne — pozycja niska, 3 krótkie odpychania, sprint 15m × 6
• V-start (na gwizdek) × 4/stronę
• Sprint z krążkiem — prowadzenie + max prędkość 20m × 4
• Slalom szybki (6 pachołków) + strzał × 5

GRA (15 min):
• Mecz 3v3 — 90s okresy (symulacja zmian)

SCHŁADZANIE (5 min):
• Stretching krótki` },

    { title: "Tydzień 5 — Czw: Siła eksplozywna + strzały", duration: 90, order: 2,
      skillCodes: ["S1","S2","S3","S5","S6","S7","C1","C3"],
      objectives: "Siła eksplozywna (C1, C3). Strzał wrist (S1, S2), backhand (S3), snap (S5), one-timer (S7), dobijanie (S6).",
      notes: `ROZGRZEWKA (15 min):
• Trucht + ABC biegowe + aktywacja nerwowo-mięśniowa

SIŁA EKSPLOZYWNA (25 min):
• Kettlebell swing × 12 × 3
• Box jumps × 8 × 3
• Medball slam × 10 × 3
• Przysiad z wyskokiem × 8 × 3
• Przerwa 90s między seriami

STRZAŁY NA ROLKACH (35 min):
• Wrist shot — stojąc, cel w 4 rogi bramki × 10
• Snap shot — wprowadzenie: szybki release bez zamachu × 8
• Strzał w ruchu — jazda po łuku + strzał z 5m × 6
• One-timer — partner podaje, strzał jednym dotykiem × 8
• Dobijanie (rebound) — trener strzela w bramkarza/ścianę, dobitka × 8

GRA (10 min):
• 'Snajper' — każdy 5 strzałów, trener liczy trafienia w cele

SCHŁADZANIE (5 min):
• Stretching + hydratacja` },

    { title: "Tydzień 5 — Sb: Zwinność + core", duration: 60, order: 3,
      skillCodes: ["C3","C5"],
      objectives: "Zwinność: T-Test, Illinois, 5-10-5 (C3). Core zaawansowany: Pallof press, farmers walk (C5).",
      notes: `ROZGRZEWKA (15 min):
• Trucht + mobilność + drabinka koordynacyjna

ZWINNOŚĆ (25 min):
• T-Test × 4 (pomiar czasu!)
• Illinois agility × 3
• 5-10-5 shuttle × 4
• Karaoke + sprint × 6 (5m karaoke → 10m sprint)

CORE ZAAWANSOWANY (15 min):
• Pallof press × 10/stronę × 3
• Farmers walk 30m × 3
• Plank z wyciągnięciem ręki × 8/stronę × 3
• Suitcase carry 20m/stronę × 2

STRETCHING (5 min)` },
  ],
};

const LETNI_SZLIF: PhaseDef = {
  name: "Sezon letni — Blok III: Szlif",
  season: "summer-2026",
  planType: "MONTHLY",
  description: "Mezocykl sierpień (tyg. 9-12). Gry małe + specjalizacja techniczna. Przygotowanie do sezonu lodowego.",
  startDate: "2026-08-03",
  dayPattern: "mon-thu-sat",
  sessions: [
    { title: "Tydzień 9 — Pn: Gry małe + sytuacje taktyczne", duration: 90, order: 1,
      skillCodes: ["A1","A2","A4","A10","O1","O2","O5","P9"],
      objectives: "2v1/2v2/3v2 — wolne lody (A1), give-and-go (A2), carry-in (A4), kreowanie 2v1 (A10). Obrona gap (O1), cofanie (O2), blokowanie podania (O5). Podanie na wolne (P9).",
      notes: `ROZGRZEWKA (15 min):
• Jazda swobodna z krążkiem 5 min
• Podania w trójkach w ruchu (trójkąt) 5 min
• Strzały na rozgrzanie × 5

TAKTYKA (35 min):
• 2v1 — napastnicy wchodzą do strefy, obrońca cofa się. Nacisk: podanie w odpowiednim momencie.
• 2v2 — obaj obrońcy cofają się, napastnicy decydują: carry-in czy dump
• 3v2 — trójkąt ofensywny, poszukiwanie wolnych lodów
• Po każdej sytuacji: 30s omówienie "co zadziałało"

GRY MAŁE (30 min):
• 3v3 ciągła gra — 90s zmiany, trener koryguje pozycjonowanie
• Reguła specjalna: gol z dobitki = 2 pkt (uczy gry przed bramką)
• Reguła: min. 1 podanie przed strzałem

SCHŁADZANIE (10 min):
• Stretching + omówienie kluczowych momentów` },

    { title: "Tydzień 9 — Czw: Power play + osłabienie", duration: 90, order: 2,
      skillCodes: ["A11","O5","O6","S1","S3","K7"],
      objectives: "Power play (A11). Blokowanie linii podania (O5), shot block (O6). Strzał forehand (S1), backhand (S3). Deking 1v1 (K7).",
      notes: `ROZGRZEWKA (15 min):
• Podania szybkie w czwórkach (kwadrat) 5 min
• Strzały snap/wrist × 8

POWER PLAY (25 min):
• 4v3 — ustawienie 'diament' (1 wysoko, 2 na skrzydłach, 1 przed bramką)
• Rotacja: podanie → ruch → opcja strzału
• 3v4 (osłabienie) — agresywny pressing, blokowanie linii podania
• 5 prób w każdej formacji, rotacja zawodników

RZUTY KARNE (15 min):
• Każdy zawodnik: 3 próby (forehand, backhand, deking)
• Bramkarz rotuje

MECZ (25 min):
• Pełny mecz 4v4 — 3 × 5 min okresy
• Symulacja kary: co 3 min losowa kara (osłabienie 2 min)

SCHŁADZANIE (10 min):
• Stretching` },

    { title: "Tydzień 12 — Testy sprawności końcowe", duration: 90, order: 3,
      skillCodes: ["C3","C4","K10","S1","S8"],
      objectives: "Testy końcowe: sprint (C3), shuttle, Illinois, slalom+strzał (K10), Cooper (C4), strzały do celu (S1, S8).",
      notes: `ROZGRZEWKA (15 min):
• Trucht + mobilność + oswojenie torów testowych

TESTY (60 min — 10 min na test):
• Sprint 10m — 2 próby, lepszy wynik
• Shuttle run 4×9m — 2 próby
• Illinois agility — 2 próby
• Slalom z krążkiem + strzał — 3 próby, czas + trafienie
• Cooper test 6 min — max dystans
• Strzały do celu — 10 prób, liczymy celne (forehand, 6m od bramki, 4 cele w rogach)

PORÓWNANIE WYNIKÓW (10 min):
• Każdy zawodnik otrzymuje kartę z wynikami Start vs Koniec
• Trener komentuje indywidualny postęp

ZAMKNIĘCIE (5 min):
• Podsumowanie sezonu letniego
• Zapowiedź: wrzesień = rolki + HLH, listopad = LÓD` },
  ],
};

// ═══════════════════════════════════════════════════════════════
// GENERATOR DAT
// ═══════════════════════════════════════════════════════════════

function generateDates(startDate: string, pattern: string, count: number): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate + "T19:00:00");
  const dayMap: Record<string, number[]> = {
    "mon-thu": [1, 4],           // poniedziałek, czwartek
    "mon-thu-sat": [1, 4, 6],   // poniedziałek, czwartek, sobota
  };
  const targetDays = dayMap[pattern] || [1, 4];
  const current = new Date(start);

  // Cofnij do poniedziałku tygodnia startowego
  while (current.getDay() !== targetDays[0]) {
    current.setDate(current.getDate() - 1);
  }

  while (dates.length < count) {
    if (targetDays.includes(current.getDay())) {
      const d = new Date(current);
      // Sobotnie treningi o 10:00, reszta o 19:00
      d.setHours(current.getDay() === 6 ? 10 : 19, 0, 0, 0);
      if (d >= start || dates.length === 0) {
        dates.push(d);
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ═══════════════════════════════════════════════════════════════
// GŁÓWNA FUNKCJA SEED
// ═══════════════════════════════════════════════════════════════

const ALL_PROGRAMS: ProgramDef[] = [
  {
    name: "Program Roczny Mikrus (U8)",
    category: "U8",
    description: "Roczny program szkoleniowy Mikrus — 14 jednostek rolkowych (kwiecień-czerwiec) w 2 fazach: Oswojenie + Podstawy techniczne. Koncepcja: zabawa, bezpieczeństwo, pierwsze umiejętności.",
    season: "2025/2026",
    phases: [MIKRUS_ROLKI, MIKRUS_ROLKI_2],
  },
  {
    name: "Konspekt Letni SWH (czerwiec-sierpień)",
    category: "U10",
    description: "Sezon letni 2026: 3 mezocykle (Baza/Budowa/Szlif). Program ogólnorozwojowy + technika rolkowa + kondycja. Wspólny dla Mini Hokej i Młodzik z różnicowaniem obciążeń.",
    season: "summer-2026",
    phases: [LETNI_BAZA, LETNI_BUDOWA, LETNI_SZLIF],
  },
];

async function main() {
  console.log("🏒 Seed: Plany treningowe SWH z treścią jednostek");

  // Znajdź admina
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.error("❌ Brak użytkownika ADMIN w bazie. Najpierw uruchom główny seed.");
    process.exit(1);
  }
  console.log(`   Admin: ${admin.name} (${admin.id})`);

  // Znajdź grupy treningowe
  const groups = await prisma.trainingGroup.findMany();
  console.log(`   Znalezione grupy: ${groups.map(g => g.name).join(", ") || "brak"}`);

  for (const program of ALL_PROGRAMS) {
    console.log(`\n📋 ${program.name}`);

    // Znajdź pasującą grupę
    const matchGroup = groups.find(g => g.category === program.category);

    // Utwórz plan główny (YEARLY)
    const mainPlan = await prisma.trainingPlan.create({
      data: {
        name: program.name,
        description: program.description,
        category: program.category,
        planType: "YEARLY",
        season: program.season,
        groupId: matchGroup?.id || null,
        createdById: admin.id,
        totalSessions: program.phases.reduce((sum, p) => sum + p.sessions.length, 0),
      },
    });
    console.log(`   ✅ Plan główny: ${mainPlan.id}`);

    // Utwórz fazy (podplany)
    for (const phase of program.phases) {
      const phasePlan = await prisma.trainingPlan.create({
        data: {
          name: phase.name,
          description: phase.description,
          category: program.category,
          planType: phase.planType,
          season: phase.season,
          parentPlanId: mainPlan.id,
          groupId: matchGroup?.id || null,
          createdById: admin.id,
          totalSessions: phase.sessions.length,
          totalDuration: phase.sessions.reduce((sum, s) => sum + s.duration, 0),
        },
      });
      console.log(`   📂 Faza: ${phase.name} (${phase.sessions.length} sesji)`);

      // Utwórz sesje treningowe z datami i powiązaniami z umiejętnościami
      const phaseDates = phase.startDate && phase.dayPattern
        ? generateDates(phase.startDate, phase.dayPattern, phase.sessions.length)
        : [];

      for (let i = 0; i < phase.sessions.length; i++) {
        const session = phase.sessions[i];
        const sessionDate = phaseDates[i] || null;

        const createdSession = await prisma.trainingSession.create({
          data: {
            planId: phasePlan.id,
            title: session.title,
            duration: session.duration,
            objectives: session.objectives,
            notes: session.notes,
            order: session.order,
            date: sessionDate,
          },
        });

        // Powiąż sesję z umiejętnościami Grutha (SessionSkillFocus)
        if (session.skillCodes && session.skillCodes.length > 0) {
          for (const code of session.skillCodes) {
            const skill = await prisma.skillDefinition.findUnique({
              where: { code },
            });
            if (skill) {
              await prisma.sessionSkillFocus.create({
                data: {
                  sessionId: createdSession.id,
                  skillId: skill.id,
                  intensity: session.order <= 3 ? "INTRO" : session.order <= 10 ? "TRAIN" : "DRILL",
                },
              });
            }
          }
        }

        if (sessionDate) {
          const dateStr = sessionDate.toLocaleDateString("pl-PL", { weekday: "short", day: "2-digit", month: "2-digit" });
          console.log(`      📅 ${dateStr} — ${session.title}${session.skillCodes ? ` [${session.skillCodes.join(",")}]` : ""}`);
        }
      }
    }
  }

  const totalSessions = ALL_PROGRAMS.reduce(
    (sum, p) => sum + p.phases.reduce((s, ph) => s + ph.sessions.length, 0),
    0
  );
  console.log(`\n✅ Gotowe! Utworzono ${ALL_PROGRAMS.length} programów z ${totalSessions} sesjami treningowymi.`);
  console.log("   📅 Sesje zsynchronizowane z kalendarzem (Pn/Czw/Sb od kwietnia 2026)");
  console.log("   🏒 Sesje powiązane z umiejętnościami Grutha (Karta Rozwoju)");
  console.log("   Wejdź w Dashboard → Szkolenie / Kalendarz → zobaczysz plany z treścią.");
  console.log("\n⚠️  UWAGA: Uruchom NAJPIERW seed-skills.ts żeby powiązania z Kartą Rozwoju zadziałały!");
}

main()
  .catch((e) => {
    console.error("❌ Błąd:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
