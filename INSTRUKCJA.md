# SWH Manager — Instrukcja uruchomienia i testowania

## 1. Wymagania

- **Node.js** >= 18.x (zalecany 20+)
- **PostgreSQL** >= 14 (do pracy z prawdziwymi danymi)
- **npm** (dostarczany z Node.js)

---

## 2. Instalacja

```bash
cd C:\Users\Wojte\Downloads\aplikacja\SWH_Manager\swh-manager

# Instalacja zależności
npm install
```

---

## 3. Konfiguracja bazy danych

Utwórz plik `.env` w katalogu głównym projektu:

```env
# Baza danych PostgreSQL
DATABASE_URL="postgresql://uzytkownik:haslo@localhost:5432/swh_manager"

# NextAuth — sekret sesji (wygeneruj losowy ciąg)
NEXTAUTH_SECRET="twoj-losowy-sekret-minimum-32-znaki"
NEXTAUTH_URL="http://localhost:3000"
```

Następnie utwórz tabele w bazie:

```bash
# Generowanie klienta Prisma
npx prisma generate

# Migracja bazy danych (tworzy tabele)
npx prisma db push

# Utworzenie konta administratora
# Otwórz przeglądarkę → http://localhost:3000/api/seed (POST)
# lub użyj curl:
curl -X POST http://localhost:3000/api/seed
```

---

## 4. Uruchomienie serwera deweloperskiego

```bash
npm run dev
```

Serwer uruchomi się na **http://localhost:3000**

---

## 5. Logowanie

### Domyślne konto administratora

Po wywołaniu endpointu `/api/seed` (patrz krok 3):

| Pole   | Wartość          |
|--------|------------------|
| Email  | `admin@swh.pl`   |
| Hasło  | `Admin123!`      |

Dane logowania wyświetlane są również na stronie logowania.

---

## 6. Import programu szkoleniowego SWH 2025/2026

Po zalogowaniu jako Administrator:

1. Przejdź do **Szkolenie** (w menu bocznym)
2. Kliknij przycisk **"Import programu SWH"** (w prawym górnym rogu)
3. Potwierdź import

Zostanie zaimportowanych:
- **~70 ćwiczeń** w 10 kategoriach (jazda, strzały, podania, prowadzenie, taktyka, kondycja, gra, rozgrzewka, bramkarz)
- **6 planów treningowych** (3 grupy wiekowe × 2 fazy sezonu)
- **~60 sesji treningowych** z miesięczną progresją
- **22 turnieje HLH** (T1–T6 lodowe + TR1–TR5 rolkowe, osobno Mini Hokej i Młodzik)
- **2 obozy sportowe** w Giżycku (lipiec — młodsi, sierpień — Młodzik)

Alternatywnie, z CLI (po podłączeniu bazy):
```bash
npm run seed
```

---

## 7. Testowanie poszczególnych modułów

### A) Dashboard
- Po zalogowaniu widzisz karty statystyk (zawodnicy, płatności, zgłoszenia)
- Widok zależy od roli (Admin widzi wszystko, Rodzic — tylko składki i harmonogram)

### B) Zawodnicy (`/dashboard/players`)
- Dodaj zawodnika: imię, nazwisko, data urodzenia, pozycja
- Filtruj po statusie (aktywny, nieaktywny, kontuzjowany)

### C) Grupy (`/dashboard/groups`)
- Utwórz grupę treningową (np. "Mini Hokej U10")
- Przypisz zawodników do grup

### D) Składki (`/dashboard/payments`)
- Zdefiniuj składkę (np. "Składka miesięczna — 200 zł")
- Nalicz płatności dla grupy
- Śledź status: opłacone / zaległe / częściowe

### E) Harmonogram (`/dashboard/schedule`)
- Dodaj zajęcia cykliczne (dzień, godzina, lokalizacja, grupa)
- Harmonogram wyświetla się w widoku tygodniowym

### F) Obecności (`/dashboard/attendance`)
- Zaznacz obecność na zajęciach
- Historia obecności per zawodnik

### G) Ogłoszenia (`/dashboard/announcements`)
- Twórz ogłoszenia dla wybranych grup / wszystkich
- System potwierdzeń (rodzice potwierdzają przeczytanie)

### H) Wiadomości (`/dashboard/messages`)
- Wewnętrzny komunikator (1:1 i grupowy)
- Wyszukiwanie użytkowników, historia rozmów

### I) Turnieje (`/dashboard/tournaments`)
- Po imporcie programu: 22 turnieje HLH z datami i lokalizacjami
- Dodawaj mecze, wpisuj wyniki
- Zarządzaj powołaniami (callups)

### J) Obozy (`/dashboard/camps`)
- Po imporcie: 2 obozy Giżycko
- Rejestracja uczestników, śledzenie płatności
- Automatyczna lista rezerwowa (gdy przekroczone limity miejsc)

### K) Szkolenie (`/dashboard/training`)
- Zakładka **Plany treningowe**: 6 planów z sesjami
- Zakładka **Baza ćwiczeń**: ~70 ćwiczeń z kategoriami i trudnością
- Tworzenie nowych planów i ćwiczeń

### L) Kalendarz (`/dashboard/calendar`)
- Widok miesięczny łączący: treningi (niebieski), turnieje (pomarańczowy), obozy (zielony), sesje szkoleniowe (fioletowy)
- Filtrowanie po typie wydarzenia
- Lista nadchodzących wydarzeń

### M) Sprzęt (`/dashboard/equipment`)
- Inwentaryzacja sprzętu (kaski, ochraniacze, kije, rolki...)
- Wypożyczalnia z śledzeniem terminów zwrotu
- Alert o przeterminowanych wypożyczeniach

### N) Nabór (`/dashboard/recruitment`)
- Formularz rejestracyjny z 5 zgodami (RODO, regulamin, etc.)
- Status zgłoszeń: nowe / zaakceptowane / odrzucone

### O) Ustawienia (`/dashboard/settings`)
- Dostępne tylko dla Administratora

---

## 8. Role użytkowników

| Rola     | Dostęp                                                              |
|----------|---------------------------------------------------------------------|
| ADMIN    | Pełny dostęp do wszystkich modułów + ustawienia                     |
| COACH    | Zawodnicy, grupy, harmonogram, obecności, szkolenie, turnieje, obozy |
| PARENT   | Składki, harmonogram, ogłoszenia, wiadomości, kalendarz              |
| PLAYER   | Dashboard, harmonogram, ogłoszenia, wiadomości, kalendarz            |

---

## 9. Struktura techniczna

```
swh-manager/
├── prisma/
│   ├── schema.prisma      # Schemat bazy danych (20+ modeli)
│   ├── seed.ts            # Skrypt importu programu (CLI)
│   └── seed-data.ts       # Dane programu szkoleniowego SWH
├── src/
│   ├── app/
│   │   ├── api/           # Endpointy REST API
│   │   ├── dashboard/     # Strony panelu (15 modułów)
│   │   └── login/         # Strona logowania
│   ├── components/
│   │   ├── sidebar.tsx    # Nawigacja boczna
│   │   ├── providers.tsx  # SessionProvider + Toaster
│   │   └── ui/            # Komponenty shadcn/ui
│   └── lib/
│       ├── prisma.ts      # Klient Prisma
│       ├── auth-helpers.ts # Helpery autoryzacji
│       └── utils.ts       # Narzędzia
└── .env                   # Konfiguracja (do utworzenia)
```

---

## 10. Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| `CLIENT_FETCH_ERROR` po logowaniu | Brak podłączonej bazy PostgreSQL — to oczekiwane zachowanie |
| Przekierowanie na `/login` | Brak sesji — zaloguj się |
| Puste listy (brak danych) | Podłącz bazę i użyj importu programu |
| `NEXTAUTH_SECRET` error | Dodaj zmienną do pliku `.env` |
| Port 3000 zajęty | Użyj `npm run dev -- --port 3001` |

---

## 11. Następne kroki (produkcja)

1. **Baza danych**: Podłączyć PostgreSQL (np. Supabase, Railway, Neon)
2. **Hosting**: Deploy na Vercel (natywne wsparcie Next.js)
3. **Domena**: Skonfigurować domenę (np. app.swh-siedlce.pl)
4. **HTTPS**: Automatyczne na Vercel
5. **Backup**: Regularne kopie bazy danych
