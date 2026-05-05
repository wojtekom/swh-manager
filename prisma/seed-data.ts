// @ts-nocheck
// Dane programu szkoleniowego SWH 2025/2026
// Na podstawie: Hockey Canada LTPD Model, dostosowane do SWH Siedlce

// ==================== ĆWICZENIA (DRILLS) ====================

export const DRILLS = [
  // === SKATING (jazda na łyżwach / rolkach) ===
  { name: "Slalom wokół pachołków", category: "SKATING", description: "Jazda slalomem pomiędzy pachołkami ustawionymi w linii — nauka kontroli krawędzi i skrętów.", difficulty: 1, ageGroups: "U8,U10", duration: 8 },
  { name: "Start-stop pod ścianą", category: "SKATING", description: "Jazda do ściany, zatrzymanie T-stopem, powrót. Ćwiczenie hamowania i startu.", difficulty: 1, ageGroups: "U8", duration: 5 },
  { name: "Jazda tyłem — podstawy", category: "SKATING", description: "Nauka jazdy tyłem: odpychanie noga za nogą, utrzymanie równowagi.", difficulty: 2, ageGroups: "U8,U10", duration: 8 },
  { name: "Upadki i wstawanie", category: "SKATING", description: "Nauka bezpiecznego upadania i szybkiego wstawania na lodzie — fundament bezpieczeństwa.", difficulty: 1, ageGroups: "U8", duration: 5 },
  { name: "Crossover przód", category: "SKATING", description: "Krzyżowanie nóg na zakrętach — crossover do przodu. Stacje rotacyjne.", difficulty: 2, ageGroups: "U10,U12", duration: 10 },
  { name: "Crossover tył z krzyżowaniem", category: "SKATING", description: "Jazda tyłem z crossoverem — zaawansowana technika dla starszych grup.", difficulty: 3, ageGroups: "U10,U12,U14", duration: 10 },
  { name: "Skoki krawędzi", category: "SKATING", description: "Przeskoki z krawędzi wewnętrznej na zewnętrzną — budowanie siły nóg i kontroli.", difficulty: 3, ageGroups: "U10,U12", duration: 8 },
  { name: "Crossover wyjściowy zaawansowany", category: "SKATING", description: "Hokejowe obroty + crossover wyjściowy z pełną prędkością. Ćwiczenia z oporem (2-osobowe).", difficulty: 4, ageGroups: "U14,U16", duration: 12 },
  { name: "Hokejowe obroty 360°", category: "SKATING", description: "Obroty na jednej nodze, przejście z jazdy przodem do tyłu i odwrotnie w pełnej szybkości.", difficulty: 4, ageGroups: "U14,U16", duration: 10 },
  { name: "Przyspieszenie 20m", category: "SKATING", description: "Eksplozywny start i przyspieszenie na dystansie 20 metrów — budowanie szybkości.", difficulty: 3, ageGroups: "U12,U14,U16", duration: 8 },
  { name: "Jazda tyłem z przesunięciem", category: "SKATING", description: "Jazda tyłem z lateralnym przesunięciem — zastawka obrońcy.", difficulty: 4, ageGroups: "U14,U16", duration: 10 },
  { name: "Crossover agresywny na rolkach", category: "SKATING", description: "Adaptacja crossovera lodowego na rolki — agresywny skręt, przyspieszenie na 20m.", difficulty: 3, ageGroups: "U10,U12,U14,U16", duration: 10 },
  { name: "Adaptacja lód → rolki", category: "SKATING", description: "Pierwsze rolki po sezonie lodowym: hamowanie, skręt, jazda prosto. Transfer techniki.", difficulty: 2, ageGroups: "U8,U10,U12,U14,U16", duration: 15 },

  // === STICKHANDLING (prowadzenie krążka/piłki) ===
  { name: "Prowadzenie stacjonarne", category: "STICKHANDLING", description: "Prowadzenie krążka/piłki w miejscu — forehand/backhand, kontrola kija.", difficulty: 1, ageGroups: "U8,U10", duration: 8 },
  { name: "Prowadzenie w wolnym biegu", category: "STICKHANDLING", description: "Prowadzenie krążka w biegu z głową uniesioną — spostrzegawczość.", difficulty: 2, ageGroups: "U8,U10", duration: 10 },
  { name: "Prowadzenie w galopie", category: "STICKHANDLING", description: "Prowadzenie krążka w szybkim galopie z omijaniem przeszkód.", difficulty: 3, ageGroups: "U10,U12", duration: 10 },
  { name: "Prowadzenie z głową uniesioną", category: "STICKHANDLING", description: "Prowadzenie piłki/krążka w biegu bez patrzenia w dół — czytanie gry.", difficulty: 3, ageGroups: "U10,U12,U14", duration: 10 },
  { name: "Prowadzenie ze zmianą kierunku pod presją", category: "STICKHANDLING", description: "Prowadzenie z nagłą zmianą kierunku przy nacisku obrońcy.", difficulty: 4, ageGroups: "U14,U16", duration: 12 },

  // === PASSING (podania) ===
  { name: "Podanie parami stacjonarne", category: "PASSING", description: "Podania forehand parami w miejscu — nauka celności i odbioru.", difficulty: 1, ageGroups: "U8,U10", duration: 8 },
  { name: "Podanie forehand/backhand w biegu", category: "PASSING", description: "Podania forehand i backhand w biegu — ćwiczenie płynności i dokładności.", difficulty: 2, ageGroups: "U10,U12", duration: 10 },
  { name: "Podanie na 1 kontakt", category: "PASSING", description: "Szybkie podanie bez zatrzymywania krążka — 1 kontakt. Celność 80%+.", difficulty: 3, ageGroups: "U12,U14,U16", duration: 10 },
  { name: "Podanie jednorazowe w biegu", category: "PASSING", description: "Podania jednorazowe w pełnym biegu — szybkość decyzji i precyzja.", difficulty: 4, ageGroups: "U14,U16", duration: 12 },
  { name: "Trójkąt podawania", category: "PASSING", description: "Podania w trójkącie — rotacja pozycji, komunikacja, budowanie gry ofensywnej.", difficulty: 3, ageGroups: "U12,U14,U16", duration: 12 },
  { name: "Give & Go (podaj i jedź)", category: "PASSING", description: "Podstawowa kombinacja: podanie + natychmiastowy ruch na wolne — 2v1 basis.", difficulty: 2, ageGroups: "U10,U12", duration: 10 },

  // === SHOOTING (strzały) ===
  { name: "Strzał do mini-bramki", category: "SHOOTING", description: "Strzał z bliskiej odległości do małej bramki — nauka celowania.", difficulty: 1, ageGroups: "U8", duration: 8 },
  { name: "Strzał bez ruchu (stacjonarny)", category: "SHOOTING", description: "Strzał z miejsca — forehand, kontrola siły i kierunku.", difficulty: 1, ageGroups: "U8,U10", duration: 8 },
  { name: "Wyjazd na strzał", category: "SHOOTING", description: "Wyjazd z krążkiem i strzał — koordynacja jazdy i oddania strzału.", difficulty: 2, ageGroups: "U8,U10", duration: 10 },
  { name: "Strzał z nadgarstka (wrist shot)", category: "SHOOTING", description: "Technika strzału z nadgarstka — snap, precyzja, siła.", difficulty: 2, ageGroups: "U10,U12", duration: 10 },
  { name: "Strzał z slapa (slap shot)", category: "SHOOTING", description: "Mocny strzał slapem — zamach, kontakt z lodem, follow-through.", difficulty: 3, ageGroups: "U10,U12,U14", duration: 10 },
  { name: "Deksel (roof shot)", category: "SHOOTING", description: "Strzał pod poprzeczkę — podnoszenie krążka.", difficulty: 3, ageGroups: "U10,U12,U14", duration: 8 },
  { name: "Strzały z 3 pozycji", category: "SHOOTING", description: "Strzały z lewego skrzydła, prawego skrzydła i centrum — pozycyjna rotacja.", difficulty: 3, ageGroups: "U12,U14", duration: 12 },
  { name: "Strzały pozycyjne zaawansowane", category: "SHOOTING", description: "Strzał z koła, z zastawki, ze skrzydła w pełnym biegu. Wrist, slap, snap.", difficulty: 4, ageGroups: "U14,U16", duration: 15 },
  { name: "Pass and shoot", category: "SHOOTING", description: "Przyjmij podanie → natychmiastowy strzał. Szybkość oddania strzału.", difficulty: 3, ageGroups: "U10,U12,U14", duration: 10 },
  { name: "Strzał backhand w biegu", category: "SHOOTING", description: "Zaawansowany strzał z backhandu w pełnym biegu — sezon rolkowy.", difficulty: 4, ageGroups: "U14,U16", duration: 10 },
  { name: "50 strzałów dziennie (suche)", category: "SHOOTING", description: "Suche ćwiczenie strzałowe w hali — 50 powtórzeń, wrist i snap.", difficulty: 2, ageGroups: "U14,U16", duration: 20 },

  // === TACTICS (taktyka) ===
  { name: "1v0 do bramki (zabawy z celowaniem)", category: "TACTICS", description: "Proste wybiegnięcie 1v0 i strzał — nauka atakowania bramki.", difficulty: 1, ageGroups: "U8", duration: 8 },
  { name: "1v1 ofensywnie i defensywnie", category: "TACTICS", description: "Sytuacja 1v1: fake, zmiana kierunku, zatrzymanie rywala.", difficulty: 2, ageGroups: "U10,U12", duration: 10 },
  { name: "Obrona bramki 1v1", category: "TACTICS", description: "Obrona pozycyjna 1v1 — pressing, pozycjonowanie ciała.", difficulty: 3, ageGroups: "U10,U12,U14", duration: 10 },
  { name: "Sytuacja 2v1", category: "TACTICS", description: "Gra 2v1: kiedy podać, kiedy jechać samemu. Decyzje w ataku.", difficulty: 2, ageGroups: "U10,U12,U14", duration: 12 },
  { name: "Sytuacja 3v2", category: "TACTICS", description: "Gra 3v2: trójkąt ofensywny, wjazd do strefy, opcje podania.", difficulty: 3, ageGroups: "U12,U14,U16", duration: 15 },
  { name: "Forechecking 1v1", category: "TACTICS", description: "Pressing 1v1 na gracza z krążkiem w strefie obrony rywala.", difficulty: 3, ageGroups: "U14,U16", duration: 10 },
  { name: "Forechecking 2-1-2", category: "TACTICS", description: "System forecheck 2-1-2: dwóch napiera, jeden wspiera, dwóch zabezpiecza.", difficulty: 4, ageGroups: "U14,U16", duration: 15 },
  { name: "Breakout 1-3-1", category: "TACTICS", description: "Wyjście z obrony w ustawieniu 1-3-1: obrońca → centr → skrzydłowy.", difficulty: 4, ageGroups: "U14,U16", duration: 15 },
  { name: "Breakout z obrony — L-pass", category: "TACTICS", description: "Opcja breakoutu z L-passem wzdłuż bandy — szybkie wyjście z third.", difficulty: 3, ageGroups: "U12,U14,U16", duration: 12 },
  { name: "Gra w przewadze 5v4", category: "TACTICS", description: "Pozycje i rotacje w grze w przewadze — power play.", difficulty: 4, ageGroups: "U14,U16", duration: 15 },
  { name: "Gra w osłabieniu 4v5", category: "TACTICS", description: "Box 4v5, clearing, pozycjonowanie — penalty kill.", difficulty: 4, ageGroups: "U14,U16", duration: 15 },
  { name: "Przesunięcia strefowe", category: "TACTICS", description: "Przesunięcia obrońców i napastników w zależności od pozycji krążka.", difficulty: 3, ageGroups: "U12,U14,U16", duration: 12 },
  { name: "Video analiza meczu", category: "TACTICS", description: "Omówienie nagrania z meczu/treningu. Indywidualny feedback dla zawodnika.", difficulty: 2, ageGroups: "U14,U16", duration: 30 },
  { name: "Ruch bez krążka (off-puck)", category: "TACTICS", description: "Pozycjonowanie bez krążka — wchodzenie w wolne, support, rotacja.", difficulty: 3, ageGroups: "U12,U14,U16", duration: 10 },

  // === GAME (gra / scrimmage) ===
  { name: "Hokejowy ogon / berki", category: "GAME", description: "Zabawa na lodzie: berki w hokejowych warunkach — budowanie radości z ruchu.", difficulty: 1, ageGroups: "U8", duration: 10 },
  { name: "Mini mecz 2v2 na pół lodu", category: "GAME", description: "Gra 2v2 na połowie lodowiska — nauka podstaw gry zespołowej.", difficulty: 1, ageGroups: "U8,U10", duration: 12 },
  { name: "Mini mecz 3v3", category: "GAME", description: "Gra 3v3 — turniej wewnętrzny, rotacja składów.", difficulty: 2, ageGroups: "U8,U10", duration: 15 },
  { name: "Gra 4v4 na pół lodu", category: "GAME", description: "Gra 4v4 z wprowadzeniem sytuacji 2v1. Miniturniej wewnętrzny.", difficulty: 2, ageGroups: "U10,U12", duration: 15 },
  { name: "Pełna gra 5v5", category: "GAME", description: "Pełny mecz 5v5 z sędziowaniem — zastosowanie taktyki z treningów.", difficulty: 3, ageGroups: "U12,U14,U16", duration: 20 },
  { name: "Turniej sparingowy", category: "GAME", description: "Mecze sparingowe z analizą błędów po grze — sezon rolkowy.", difficulty: 3, ageGroups: "U10,U12,U14,U16", duration: 20 },
  { name: "Symulacja meczu (pre-turniej)", category: "GAME", description: "30-minutowa symulacja meczu tydzień przed turniejem — tapering.", difficulty: 3, ageGroups: "U10,U12,U14,U16", duration: 30 },

  // === CONDITIONING (kondycja / wytrzymałość) ===
  { name: "Ćwiczenia ogólnorozwojowe (sala)", category: "CONDITIONING", description: "Równowaga, skok, rzut, złapanie. Ogólna sprawność fizyczna bez kijów i łyżew.", difficulty: 1, ageGroups: "U8", duration: 45 },
  { name: "Sprint, skok, rzut piłką", category: "CONDITIONING", description: "Ćwiczenia ogólnorozwojowe: sprint, skok, rzut piłką, równowaga.", difficulty: 1, ageGroups: "U10,U12", duration: 40 },
  { name: "Skakanki, trap, skoczność", category: "CONDITIONING", description: "Ćwiczenia ze skakanką, trap exercises, budowanie skoczności.", difficulty: 2, ageGroups: "U10,U12", duration: 30 },
  { name: "Drabinka koordynacyjna", category: "CONDITIONING", description: "Ćwiczenia na drabince koordynacyjnej — zwinność i szybkość nóg.", difficulty: 2, ageGroups: "U10,U12,U14,U16", duration: 15 },
  { name: "Siła funkcjonalna", category: "CONDITIONING", description: "Przysiady, deska, sprint 20m. Ćwiczenia antyurazowe (treszczyk, kolano, bark).", difficulty: 3, ageGroups: "U14,U16", duration: 45 },
  { name: "Wytrzymałość aerobowa — bieg 3km", category: "CONDITIONING", description: "Bieg ciągły 3km lub interwały 10x50m. Budowanie bazy aerobowej.", difficulty: 3, ageGroups: "U14,U16", duration: 30 },
  { name: "Martwy ciąg z ciężarem własnym", category: "CONDITIONING", description: "Trening siły: martwy ciąg, pompki, przysiady — ciężar własny ciała.", difficulty: 3, ageGroups: "U14,U16", duration: 30 },
  { name: "Ćwiczenia multisport", category: "CONDITIONING", description: "Piłka nożna, koszykówka, biegi z przeszkodami — budowanie fizycznej pisemności.", difficulty: 1, ageGroups: "U8,U10", duration: 45 },

  // === WARMUP (rozgrzewka) ===
  { name: "Rozgrzewka na lodzie — kółka", category: "WARMUP", description: "Jazda kółkami wokół lodowiska, crossovery na łukach, rozciąganie dynamiczne.", difficulty: 1, ageGroups: "U8,U10,U12,U14,U16", duration: 8 },
  { name: "Rozgrzewka z piłką hokejową (sucha)", category: "WARMUP", description: "Ćwiczenia z piłką hokejową bez lodu — przygotowanie do sesji.", difficulty: 1, ageGroups: "U10,U12", duration: 10 },

  // === GOALIE (bramkarz) ===
  { name: "Pozycja bramkarska — podstawy", category: "GOALIE", description: "Nauka ustawienia bramkarskiego: butterfly, T-push, czytanie strzału.", difficulty: 2, ageGroups: "U10,U12,U14", duration: 15 },
];

// ==================== PLANY TRENINGOWE ====================

export const TRAINING_PLANS = [
  // Faza I — Sezon lodowy
  {
    name: "Przedszkolna — Faza I (Sezon lodowy)",
    description: "Program dla grupy Przedszkolna (4-6 lat). Faza lodowa: październik 2025 – kwiecień 2026. Cel: pierwsze pozytywne doświadczenie hokeja, nauka jazdy na łyżwach jako zabawy. Proporcje: 85% technika, 15% taktyka indywidualna. Oparty na Hockey Canada LTPD: Active Start + FUNdamentals.",
    category: "U8",
    sessions: [
      // Październik — Bezpieczny start
      { title: "Październik — Lód: jazda / zabawy (Pon)", objectives: "Kask i sprzęt, wchodzenie na lód, upadki kontrolowane, jazda w przód parami.", duration: 60, order: 1, dayOfWeek: 1 },
      { title: "Październik — Lód: krążek i strzały (Śr)", objectives: "Prowadzenie krążka stacjonarnie. Strzały do bramki z bliskiej odległości.", duration: 60, order: 2, dayOfWeek: 3 },
      { title: "Październik — Sala: koordynacja ogólna (Pt/Sob)", objectives: "Ćwiczenia ogólnorozwojowe: równowaga, skok, rzut, złapanie.", duration: 60, order: 3, dayOfWeek: 5 },
      // Listopad — Mobilność na lodzie
      { title: "Listopad — Lód: jazda / zabawy (Pon)", objectives: "Slalom wokół pachołków, start ze ściany, zatrzymanie (T-stop uproszczony).", duration: 60, order: 4, dayOfWeek: 1 },
      { title: "Listopad — Lód: krążek i strzały (Śr)", objectives: "Prowadzenie stacjonarne i w ruchu. Mini gry.", duration: 60, order: 5, dayOfWeek: 3 },
      { title: "Listopad — Sala: koordynacja (Pt/Sob)", objectives: "Ćwiczenia ogólnorozwojowe — budowanie sprawności fizycznej.", duration: 60, order: 6, dayOfWeek: 5 },
      // Grudzień — Krążek w rękach
      { title: "Grudzień — Lód: jazda / zabawy (Pon)", objectives: "Prowadzenie stacjonarne, strzał bez ruchu.", duration: 60, order: 7, dayOfWeek: 1 },
      { title: "Grudzień — Lód: krążek + mini mecz (Śr)", objectives: "Mini mecz na połowie lodu 2v2.", duration: 60, order: 8, dayOfWeek: 3 },
      // Styczeń — Krążek w ruchu
      { title: "Styczeń — Lód: jazda (Pon)", objectives: "Prowadzenie krążka w wolnym biegu, podanie parami, wyjazd na strzał.", duration: 60, order: 9, dayOfWeek: 1 },
      { title: "Styczeń — Lód: krążek i strzały (Śr)", objectives: "Prowadzenie krążka w wolnym biegu, podanie parami.", duration: 60, order: 10, dayOfWeek: 3 },
      // Luty — Gra zespołowa
      { title: "Luty — Lód: turniej 3v3 (Pon)", objectives: "Turniej wewnętrzny 3v3, zabawy grupowe, rozumienie reguł mini hokeja.", duration: 60, order: 11, dayOfWeek: 1 },
      { title: "Luty — Lód: zabawy grupowe (Śr)", objectives: "Zabawy grupowe, gra zespołowa.", duration: 60, order: 12, dayOfWeek: 3 },
      // Marzec — Przegląd i święto
      { title: "Marzec — Lód: powtórka (Pon)", objectives: "Powtórka wszystkich elementów — jazda, krążek, strzały.", duration: 60, order: 13, dayOfWeek: 1 },
      { title: "Marzec — Pokaz dla rodziców (Śr)", objectives: "Pokazowy mini turniej dla rodziców, nagrody za udział.", duration: 60, order: 14, dayOfWeek: 3 },
    ],
  },
  {
    name: "Mini Hokej — Faza I (Sezon lodowy)",
    description: "Program dla grupy Mini Hokej (6-10 lat). Faza lodowa: październik 2025 – kwiecień 2026. Golden Age of Learning. Proporcje: 75% technika, 15% taktyka indywidualna, 10% taktyka zespołowa. LTPD: FUNdamentals + Learning to Train.",
    category: "U10",
    sessions: [
      // Październik — Fundamenty + T1 Białystok
      { title: "X — Lód: technika jazdy (Wt)", objectives: "Crossover przód/tył, skoki krawędzi, przyspieszenie. 6 stacji x 5 min.", duration: 60, order: 1, dayOfWeek: 2 },
      { title: "X — Lód: krążek i strzały (Czw)", objectives: "Prowadzenie w galopie, podania forehand/backhand w biegu, pass and shoot.", duration: 60, order: 2, dayOfWeek: 4 },
      { title: "X — Lód: gra i taktyka (Pt)", objectives: "Gry 3v3, 4v4 na pół lodu. Ustawienie na lodzie, pozycje.", duration: 60, order: 3, dayOfWeek: 5 },
      { title: "X — Sala: siła i koordynacja (Sob)", objectives: "Sprint, skok, rzut piłką, równowaga. Ćwiczenia z piłką hokejową.", duration: 60, order: 4, dayOfWeek: 6 },
      // Listopad — Prowadzenie + T2 Lublin
      { title: "XI — Lód: technika jazdy (Wt)", objectives: "Crossovery zaawansowane, jazda tyłem z krzyżowaniem.", duration: 60, order: 5, dayOfWeek: 2 },
      { title: "XI — Lód: prowadzenie i podanie (Czw)", objectives: "Prowadzenie z głową uniesioną, podanie backhand.", duration: 60, order: 6, dayOfWeek: 4 },
      { title: "XI — Lód: gra 2v1 (Pt)", objectives: "Gra 2v1 — kiedy podać, kiedy jechać. Give & Go.", duration: 60, order: 7, dayOfWeek: 5 },
      { title: "XI — Sala: koordynacja (Sob)", objectives: "Ćwiczenia ogólnorozwojowe.", duration: 60, order: 8, dayOfWeek: 6 },
      // Grudzień — Strzały + T3 Mińsk Maz.
      { title: "XII — Lód: technika (Wt)", objectives: "Stacje rotacyjne — jazda + prowadzenie.", duration: 60, order: 9, dayOfWeek: 2 },
      { title: "XII — Lód: strzały (Czw)", objectives: "Strzał z nadgarstka, slap, deksel. Ćwiczenia strzałowe dominujące.", duration: 60, order: 10, dayOfWeek: 4 },
      { title: "XII — Lód: gra i pozycja (Pt)", objectives: "Wyjazd na strzał, pozycja przed bramką. Gra 4v4.", duration: 60, order: 11, dayOfWeek: 5 },
      // Styczeń — 1v1 + T4 Przasnysz
      { title: "I — Lód: technika (Wt)", objectives: "Fake i zmiana kierunku, zatrzymanie rywala.", duration: 60, order: 12, dayOfWeek: 2 },
      { title: "I — Lód: 1v1 (Czw)", objectives: "1v1 ofensywnie i defensywnie. Obrona bramki 1v1, pressing.", duration: 60, order: 13, dayOfWeek: 4 },
      { title: "I — Lód: gra (Pt)", objectives: "Gra i taktyka z naciskiem na 1v1.", duration: 60, order: 14, dayOfWeek: 5 },
      // Luty — Turniej Jobczyka (T5)
      { title: "II — Lód: blok taktyczny (Wt)", objectives: "Intensywny blok taktyczny 2 tyg. przed T5. Systemy: breakout + wejście do strefy.", duration: 60, order: 15, dayOfWeek: 2 },
      { title: "II — Lód: przygotowanie turniej (Czw)", objectives: "Tapering 60%. Symulacja meczu.", duration: 60, order: 16, dayOfWeek: 4 },
      // Marzec — Praca między T5 a T6
      { title: "III — Lód: szlif (Wt)", objectives: "Powtórka i szlif umiejętności. Przygotowanie do T6 Warszawa.", duration: 60, order: 17, dayOfWeek: 2 },
      { title: "III — Lód: systemy gry 5v5 (Czw)", objectives: "Systemy gry 5v5 — przygotowanie do finału sezonu lodowego.", duration: 60, order: 18, dayOfWeek: 4 },
    ],
  },
  {
    name: "Młodzik — Faza I (Sezon lodowy)",
    description: "Program dla grupy Młodzik (10-15 lat). Faza lodowa: październik 2025 – kwiecień 2026. Najważniejszy okres specjalizacji hokejowej. Proporcje: 40-45% technika, 20-25% taktyka indywidualna, 20% taktyka zespołowa, 10-15% systemy gry, 5-10% analiza. LTPD: Learning to Train + Training to Train.",
    category: "U14",
    sessions: [
      // Październik — Ocena + T1 Białystok
      { title: "X — Lód: technika zaawansowana (Wt)", objectives: "Testy: jazda, strzał, krążek. Powtórka fundamentów. Hokejowe obroty, crossover wyjściowy.", duration: 90, order: 1, dayOfWeek: 2 },
      { title: "X — Lód: taktyka i systemy (Czw)", objectives: "Przegląd pozycji. Ustawienie 1-2-2. Dryle taktyczne 2v1, 3v2.", duration: 90, order: 2, dayOfWeek: 4 },
      { title: "X — Sala: siła i kondycja (Sob)", objectives: "Siła funkcjonalna, sprint 20m, wytrzymałość. Ćwiczenia antyurazowe.", duration: 90, order: 3, dayOfWeek: 6 },
      { title: "X — Analiza (Ndz co 2 tyg.)", objectives: "Video analiza z T1 Białystok — Husaria najsilniejszy rywal.", duration: 60, order: 4, dayOfWeek: 0 },
      // Listopad — Siła + T2 Lublin
      { title: "XI — Lód: technika (Wt)", objectives: "Strzały z 3 pozycji, podanie na 1 kontakt.", duration: 90, order: 5, dayOfWeek: 2 },
      { title: "XI — Lód: breakout (Czw)", objectives: "Breakout z obrony: opcja 1-2-2 i L-pass.", duration: 90, order: 6, dayOfWeek: 4 },
      { title: "XI — Sala: kondycja (Sob)", objectives: "Siła i wytrzymałość aerobowa.", duration: 90, order: 7, dayOfWeek: 6 },
      // Grudzień — Taktyka 2v1/3v2 + T3
      { title: "XII — Lód: technika pod presją (Wt)", objectives: "Ćwiczenia z obrońcami pod presją czasową.", duration: 90, order: 8, dayOfWeek: 2 },
      { title: "XII — Lód: trójkąt ofensywny (Czw)", objectives: "Trójkąt ofensywny, wjazd do strefy. 2v1, 3v2.", duration: 90, order: 9, dayOfWeek: 4 },
      // Styczeń — Forechecking + TEST + T4
      { title: "I — Lód: jazda tyłem + zastawka (Wt)", objectives: "Jazda tyłem z przesunięciem, zastawka. TEST PÓŁROCZNY: sprint 30m, wytrzymałość 1km.", duration: 90, order: 10, dayOfWeek: 2 },
      { title: "I — Lód: forechecking 2-1-2 (Czw)", objectives: "Forechecking 2-1-2. Indywidualne rozmowy z zawodnikami.", duration: 90, order: 11, dayOfWeek: 4 },
      // Luty — Turniej Jobczyka (T5)
      { title: "II — Lód: blok taktyczny (Wt)", objectives: "Strzały z koła i zastawek. Blok taktyczny 2 tyg. przed T5.", duration: 90, order: 12, dayOfWeek: 2 },
      { title: "II — Lód: gra 5v4/4v5 (Czw)", objectives: "T5 Siedlce — gra 4v5 i 5v4, pozycje, rotacje.", duration: 90, order: 13, dayOfWeek: 4 },
      // Marzec-Kwiecień — Szlif + T6 Warszawa
      { title: "III-IV — Lód: strzały pozycyjne (Wt)", objectives: "Strzały pozycyjne zaawansowane. Ćwiczenia pre-season na lód/rolki.", duration: 90, order: 14, dayOfWeek: 2 },
      { title: "III-IV — Lód: systemy gry (Czw)", objectives: "T6 Legia Warszawa — szczyt sezonu. Analiza video po T6. Testy wyjściowe.", duration: 90, order: 15, dayOfWeek: 4 },
    ],
  },

  // Faza II — Sezon letni (rolki)
  {
    name: "Przedszkolna — Faza II (Sezon letni / Rolki)",
    description: "Program dla grupy Przedszkolna (4-6 lat). Faza letnia: maj – wrzesień 2026. Utrwalenie miłości do aktywności, wprowadzenie rolek, kontynuacja zabawy hokejowej.",
    category: "U8",
    sessions: [
      { title: "Rolki — jazda i zabawa (Wt)", objectives: "Pierwsze rolki: upadki, wstawanie, jazda do przodu. Slalom wokół pachołków.", duration: 60, order: 1, dayOfWeek: 2 },
      { title: "Rolki — krążek/piłka (Czw)", objectives: "Prowadzenie piłki na rolkach, strzał do mini-bramki. Gry 2v2.", duration: 60, order: 2, dayOfWeek: 4 },
      { title: "Boisko — multisport (Sob)", objectives: "Piłka nożna, koszykówka, biegi z przeszkodami. Budowanie fizycznej pisemności.", duration: 60, order: 3, dayOfWeek: 6 },
    ],
  },
  {
    name: "Mini Hokej — Faza II (Sezon letni / Rolki)",
    description: "Program dla grupy Mini Hokej (6-10 lat). Faza letnia: maj – wrzesień 2026. Utrzymanie umiejętności technicznych, rozwój kondycji, turnieje rolkowe HLH (TR1-TR5).",
    category: "U10",
    sessions: [
      { title: "Rolki — technika jazdy (Pon)", objectives: "Crossovery na rolkach, skręt agresywny, jazda tyłem. Transfer techniki lodowej.", duration: 60, order: 1, dayOfWeek: 1 },
      { title: "Rolki — krążek i strzały (Śr)", objectives: "Ćwiczenia z piłką/krążkiem na rolkach. Podania w biegu. Strzały 5v5. Dryle 2v1.", duration: 60, order: 2, dayOfWeek: 3 },
      { title: "Rolki — gra i turnieje (Pt)", objectives: "Pełna gra 5v5 lub 4v4. Turnieje sparingowe. Analiza błędów.", duration: 60, order: 3, dayOfWeek: 5 },
      { title: "Hala — siła i kondycja (Sob)", objectives: "Sprint, skok, skakanki, wytrzymałość, drabinka koordynacyjna.", duration: 60, order: 4, dayOfWeek: 6 },
    ],
  },
  {
    name: "Młodzik — Faza II (Sezon letni / Rolki)",
    description: "Program dla grupy Młodzik (10-15 lat). Faza letnia: maj – wrzesień 2026. Building the Engine — intensywny rozwój kondycji, konsolidacja taktyki, turnieje rolkowe HLH.",
    category: "U14",
    sessions: [
      { title: "Rolki — jazda zaawansowana (Pon)", objectives: "Crossovery agresywne, skręt tylny, przyspieszenie na 20m.", duration: 90, order: 1, dayOfWeek: 1 },
      { title: "Rolki — taktyka i systemy (Śr)", objectives: "2v1, 3v2 na rolkach. Forechecking agresywny. Systemy breakout.", duration: 90, order: 2, dayOfWeek: 3 },
      { title: "Rolki — mecz / sparing (Pt)", objectives: "Pełna gra 5v5. Video po meczu. Omówienie błędów i pochwały.", duration: 90, order: 3, dayOfWeek: 5 },
      { title: "Siła i atletyzm (Sob)", objectives: "Przysiady, martwy ciąg, pompki. Bieg 3km lub interwały 10x50m. Drabinka.", duration: 90, order: 4, dayOfWeek: 6 },
      { title: "Analiza / teoria (Ndz co 2 tyg.)", objectives: "Video z meczów. Analiza taktyczna porównująca grę na lodzie i rolkach.", duration: 60, order: 5, dayOfWeek: 0 },
    ],
  },
];

// ==================== TURNIEJE HLH ====================

export const HLH_TOURNAMENTS = [
  // Sezon lodowy — 6 turniejów
  { name: "HLH T1 — Otwarcie sezonu", location: "Białystok — Lodowisko Husarii", startDate: "2025-10-18", category: "U10", description: "Otwarcie sezonu lodowego. Husaria Białystok — caloroczne lodowisko. Najsilniejszy rywal technicznie. Dystans: 195 km." },
  { name: "HLH T1 — Otwarcie sezonu (Młodzik)", location: "Białystok — Lodowisko Husarii", startDate: "2025-10-18", category: "U14", description: "Otwarcie sezonu lodowego — Młodzik. Husaria Białystok. Testy: jazda, strzał, krążek. Dystans: 195 km." },

  { name: "HLH T2 — Budowanie rytmu", location: "Lublin — Lodowisko LHT", startDate: "2025-11-15", category: "U10", description: "LHT Lublin — ważny partner strategiczny. Korekta bloku strzałowego. Dystans: 115 km." },
  { name: "HLH T2 — Budowanie rytmu (Młodzik)", location: "Lublin — Lodowisko LHT", startDate: "2025-11-15", category: "U14", description: "LHT Lublin — szybkie decyzje. Breakout z obrony: opcja 1-2-2 i L-pass. Dystans: 115 km." },

  { name: "HLH T3 — Punkt przedświąteczny", location: "Mińsk Mazowiecki — Lodowisko Jets", startDate: "2025-12-13", category: "U10", description: "Jets Mińsk Maz. — najbliższy rywal. Agresywny forechecking. Dystans: 50 km." },
  { name: "HLH T3 — Punkt przedświąteczny (Młodzik)", location: "Mińsk Mazowiecki — Lodowisko Jets", startDate: "2025-12-13", category: "U14", description: "Jets Mińsk Maz. Trójkąt ofensywny, wjazd do strefy. Dystans: 50 km." },

  { name: "HLH T4 — Ocena półsezonu", location: "Przasnysz — Lodowisko Orłów", startDate: "2026-01-17", category: "U10", description: "Orły Przasnysz. Testy sprawności fizycznej (sprint, skok). Dystans: 130 km." },
  { name: "HLH T4 — Ocena półsezonu (Młodzik)", location: "Przasnysz — Lodowisko Orłów", startDate: "2026-01-17", category: "U14", description: "Orły Przasnysz. TEST PÓŁROCZNY: sprint 30m, wytrzymałość 1km. Dystans: 130 km." },

  { name: "HLH T5 — II Turniej im. Wiesława Jobczyka", location: "Siedlce — ARMS", startDate: "2026-02-07", endDate: "2026-02-08", category: "U10", description: "GOSPODARZ: SWH Siedlce. Turniej dwudniowy: Młodzik (sob) + Mini Hokej (nd). KLUCZOWY turniej sezonu. Dystans: 0 km." },
  { name: "HLH T5 — II Turniej im. Wiesława Jobczyka (Młodzik)", location: "Siedlce — ARMS", startDate: "2026-02-07", endDate: "2026-02-08", category: "U14", description: "GOSPODARZ: SWH Siedlce. Turniej dwudniowy: Młodzik (sob) + Mini Hokej (nd). KLUCZOWY turniej sezonu. Dystans: 0 km." },

  { name: "HLH T6 — Finały sezonu lodowego", location: "Warszawa — Lodowisko Legii", startDate: "2026-04-11", category: "U10", description: "Legia Warszawa — lodowisko całoroczne. Finały sezonu lodowego. Najbardziej prestiżowa impreza. Dystans: 90 km." },
  { name: "HLH T6 — Finały sezonu lodowego (Młodzik)", location: "Warszawa — Lodowisko Legii", startDate: "2026-04-11", category: "U14", description: "Legia Warszawa. Szczyt sezonu lodowego. Analiza video po T6. Testy wyjściowe Fazy I. Dystans: 90 km." },

  // Sezon rolkowy — 5 turniejów
  { name: "HLH TR1 — Start sezonu rolkowego", location: "Lublin — Rolkowisko LHT", startDate: "2026-05-16", category: "U10", description: "LHT Lublin. Start sezonu rolkowego — najdalsza trasa. Wyjazd zespołotwórczy. Dystans: 115 km." },
  { name: "HLH TR1 — Start sezonu rolkowego (Młodzik)", location: "Lublin — Rolkowisko LHT", startDate: "2026-05-16", category: "U14", description: "LHT Lublin. Budowanie bazy aerobowej. Obserwacja LHT. Dystans: 115 km." },

  { name: "HLH TR2 — Turniej domowy SWH", location: "Siedlce — Boisko SWH", startDate: "2026-06-13", category: "U10", description: "GOSPODARZ: SWH Siedlce. Turniej domowy rolkowy. Dzień otwartych drzwi i rekrutacja. Dystans: 0 km." },
  { name: "HLH TR2 — Turniej domowy SWH (Młodzik)", location: "Siedlce — Boisko SWH", startDate: "2026-06-13", category: "U14", description: "GOSPODARZ: SWH Siedlce. Przesunięcia 2-1-2. Rekrutacja + media. Dystans: 0 km." },

  { name: "HLH TR3 — Środek sezonu", location: "Przasnysz — Rolkowisko Orłów", startDate: "2026-07-11", category: "U10", description: "Orły Przasnysz. Po obozie Mini Hokej (Giżycko I). Dystans: 130 km." },
  { name: "HLH TR3 — Środek sezonu (Młodzik)", location: "Przasnysz — Rolkowisko Orłów", startDate: "2026-07-11", category: "U14", description: "Orły Przasnysz. Młodzik jedzie na TR3. Dystans: 130 km." },

  { name: "HLH TR4 — Peak forma", location: "Skarżysko-Kamienna — Rolkowisko Piratów", startDate: "2026-08-22", category: "U10", description: "Piraci Skarżysko-Kamienna. Nowy rywal, inny styl gry. Dystans: 170 km." },
  { name: "HLH TR4 — Peak forma (Młodzik)", location: "Skarżysko-Kamienna — Rolkowisko Piratów", startDate: "2026-08-22", category: "U14", description: "Piraci Skarżysko-Kamienna. Po obozie Młodzika — szczytowa forma. Dystans: 170 km." },

  { name: "HLH TR5 — Grand Finale", location: "Mińsk Mazowiecki — Rolkowisko Jets", startDate: "2026-09-12", category: "U10", description: "GRAND FINALE HLH. Jets Mińsk Maz. Podsumowanie całego roku. Nagrody roczne. Dystans: 50 km." },
  { name: "HLH TR5 — Grand Finale (Młodzik)", location: "Mińsk Mazowiecki — Rolkowisko Jets", startDate: "2026-09-12", category: "U14", description: "GRAND FINALE HLH. Testy sprawnościowe wyjściowe. Plan na sezon 2026/27. Dystans: 50 km." },
];

// ==================== OBOZY ====================

export const CAMPS = [
  {
    name: "Obóz Sportowy Giżycko I — Młodsze grupy",
    type: "CAMP",
    location: "Giżycko — centrum obozowe",
    startDate: "2026-07-06",
    endDate: "2026-07-12",
    category: "U10",
    description: "Tygodniowy obóz sportowy dla grup Przedszkolna (4-6 lat) i Mini Hokej (6-10 lat). Ok. 35 dzieci + 6 opiekunów. Program: rolki x2 dziennie (Mini Hokej) / rolki + zabawy (Przedszkolna), pływanie, kajaki, SUP, mini mecze wieczorne. Turniej obozowy: 3v3 Przedszkolna, 4v4 Mini Hokej. Finansowanie: Aktywne Wakacje.",
    maxSpots: 35,
    cost: 0, // Program Aktywne Wakacje
  },
  {
    name: "Obóz Sportowy Giżycko II — Młodzik",
    type: "CAMP",
    location: "Giżycko — centrum obozowe",
    startDate: "2026-08-03",
    endDate: "2026-08-09",
    category: "U14",
    description: "Tygodniowy obóz sportowy dla grupy Młodzik (10-15 lat). Ok. 20 zawodników + 3 trenerów. 2 sesje rolkowe dziennie (75 min), łącznie ~14 sesji technicznych i 7 gier sparingowych. Poranna aktywacja 06:30, analiza video, ćwiczenia mentalne/taktyczne. 2-dniowy turniej zakończeniowy z gościnną drużyną rolkową. Finansowanie: Aktywne Wakacje.",
    maxSpots: 20,
    cost: 0,
  },
];
