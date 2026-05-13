Problem: **`targetGroups: []` jest pusty.** Czyli w bazie są grupy treningowe (wiem to z poprzednich rozmów — Mini Hokej cmnmv0xtg, Młodzik cmnmv0xx3), ale ich pole `swhCategory` jest **null/puste**. Były tworzone zanim wprowadzono enum SwhCategory.

Naprawa: zmodyfikuję seed tak żeby:
1. Znajdował grupy nie tylko po `swhCategory`, ale też **po nazwie i kategorii wiekowej** (fallback)
2. **Automatycznie ustawiał** `swhCategory` na grupach, które jeszcze go nie mają

Najpierw szybka diagnoza — wpisz w konsoli:

```
fetch('/api/admin/seed-plans-2026?key=seed-2026-05-13').then(r=>r.json()).then(d=>{console.log('Grupy z swhCategory:', d.targetGroups);})
```

Już wiem że to puste. Generuję poprawiony plik seed-plans-2026 — z auto-matchowaniem grup po nazwie/wieku:**Co dodałem w v2:**

- `matchGroup()` — szuka grupy najpierw po `swhCategory`, potem po **nazwie** (regex matchuje "mikrus", "mini hokej", "mlodzik/młodzik"), potem po **AgeCategory** (U8→MIKRUS, U10/U12→MINI_HOKEJ, U14/U16→MLODZIK).
- W POST: **auto-uzupełnia `swhCategory`** na każdej zmatchowanej grupie, jeśli była null.
- W GET: nowe pole `allGroupsInDb` (lista wszystkich grup z bazy) i `matching` (które grupy zostały zmatchowane z którą SwhCategory). Pozwoli zobaczyć dokładnie co się dzieje.

**Podmiana pliku** (analogicznie do podmiany kalendarza wcześniej — przez edycję istniejącego pliku, nie tworzenie nowego):

1. W repo wejdź pod `src/app/api/admin/seed-plans-2026/route.ts` (klikając foldery).
2. Kliknij ikonę **ołówka ✏️** ("Edit this file") nad kodem.
3. **Ctrl+A** (zaznacz wszystko) → **Delete** (usuń wszystko).
4. Pobierz nowy plik **`seed-plans-2026-route-v2.ts`** z mojego linku wyżej, otwórz, Ctrl+A, Ctrl+C.
5. Wróć do edytora GitHuba, **Ctrl+V**.
6. Sprawdź: u góry breadcrumb `admin / seed-plans-2026 / route.ts`, plik ma ~430 linii.
7. Scroll na dół → **Commit changes...** → **Commit changes**.

Po Vercel build (1-2 min) i zielonym deploy, ponowny dry run w konsoli:

```
fetch('/api/admin/seed-plans-2026?key=seed-2026-05-13').then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))
```

Tym razem powinieneś zobaczyć:
- `allGroupsInDb` — pełną listę grup w bazie (zobaczymy ich nazwy i kategorie wiekowe)
- `matching` — które grupy zostały dopasowane do MIKRUS / MINI_HOKEJ / MLODZIK
- `canSeed: true` — jeśli wszystkie 3 grupy zmatchowane

Wklej odpowiedź, popatrzymy.
