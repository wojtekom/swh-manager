Sprawdzam, czy się udało.**Doskonale!** Sprawdziłem plik na masterze:

- ✅ JSON parsuje się prawidłowo
- ✅ Rozmiar 1604 bajtów (oryginalny rozmiar, nie 3766 jak wcześniej)
- ✅ Build script to dokładnie `prisma generate && next build` — bez `db push`

**Plik jest idealny.** Czekam ~60 sekund i sprawdzę, czy Vercel zdążył zbudować.Strona deployments się nie załadowała w pełni. Sprobuję jeszcze raz, sprawdzę też bezpośrednio działającą aplikację.Zauważam coś dziwnego. Kalendarz `/dashboard/calendar` się renderuje, ale **nadal pokazuje starą wersję** (z opcjami "Treningi/Turnieje/Obozy/Sesje" zamiast nowych chipów grup SWH). Sprawdzam, co jest w pliku kalendarza na masterze:**Świetna wiadomość: migracja jest udana, build zielony, baza zaktualizowana, dziennik-pzsw działa z nowymi funkcjami.**

Ale jedna rzecz — w pełnym chaosie ostatniej godziny przeoczyliśmy jeden plik: **`kalendarz-page.tsx` nigdy nie został wgrany jako frontend**. Sprawdziłem stronę `/dashboard/calendar` — pokazuje ci **starą wersję** kalendarza (z filtrem typów zamiast chipów grup SWH, bez eksportu ICS, bez panelu szczegółów dnia). Plik na masterze ma 11 912 znaków — to oryginał, ten, którego mi pokazałeś na początku. Mój nowy ma ~18-19k.

To **jeden plik do wgrania**, jeden commit, koniec.## Ostatni komit — kalendarz w nowej odsłonie

**Tym razem prosto, bez Notatnika** (tak jak przy ostatnim package.json):

### Krok 1 — pobierz plik

Klik w **`kalendarz-page.tsx`** powyżej → pobierze się.

### Krok 2 — otwórz edytor docelowego pliku

Wklej w pasku adresu Chrome:

```
https://github.com/Wojtekom/swh-manager/edit/master/src/app/dashboard/calendar/page.tsx
```

Otworzy się edytor kalendarza ze starą zawartością.

### Krok 3 — wyczyść i wklej

W edytorze:
- **Ctrl+A** → **Delete** (wywal całość)
- Teraz musisz wkleić nowy plik. Tutaj jest mały trick:
  1. W systemie Windows otwórz pobrany plik **`kalendarz-page.tsx`** klikając go dwukrotnie (zazwyczaj otworzy się Notatnik, VS Code, albo zapyta o aplikację — wybierz Notatnik).
  2. W oknie, które się otworzyło: **Ctrl+A** → **Ctrl+C**.
  3. Wróć do zakładki Chrome z edytorem GitHuba → **Ctrl+V**.

**Sprawdź pierwszy znak** — powinien być `"` (cudzysłów otwierający `"use client";`). Ostatni znak — `}`. Jeśli widzisz na początku coś innego (np. polski tekst albo coś z czata), powiedz mi i nie commituj.

### Krok 4 — commit

W dole edytora znajdź sekcję **"Commit changes"** → opis opcjonalny:

```
feat: kalendarz z kolorami grup SWH i eksportem ICS
```

→ **Commit directly to master branch** → zielony **Commit changes**.

---

**Napisz "wgrałem"** jak skończysz. Sprawdzę, czy plik się rozpakował OK i czy Vercel zbudował zielono. Po tym kroku **naprawdę kończymy dzisiejszą sesję** — kalendarz i dziennik będą się świecić nowymi kolorami grup SWH, eksport ICS będzie działać, klikanie w datę będzie prowadzić między widokami.
