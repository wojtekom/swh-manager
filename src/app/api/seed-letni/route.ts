Coś dziwnego — **plany roczne zniknęły z bazy**! Wcześniej (15 minut temu) były znajdowane, teraz "nie znaleziono". Sprawdzę co jest w bazie:Aha, **plany roczne "Program roczny Mini Hokej/Młodzik — SWH 2025/2026" zostały skasowane** (prawdopodobnie wcześniejsze odpalenie `/api/seed-run` które kasuje plany z season `2025/2026`). Mój seed nie znalazł rodzica i pominął całość.

Sprawdzę co jest z grupami:Grupy są: **Mini Hokej (U12)** i **Młodzik (U14)** - oba istnieją. Problem był taki, że mój endpoint przerywał gdy nie znalazł parent plana — a ten został wcześniej skasowany przez `/api/seed-run`. Naprawiam logikę: parent staje się opcjonalny.**Zmiana**: parent (plan roczny) jest teraz **opcjonalny** — jeśli go nie ma, podplan zostanie utworzony "samodzielnie", bez rodzica. Najważniejsze (`groupId` z grupy "Mini Hokej"/"Młodzik") działa niezależnie.

**Wgraj poprawkę:**

Otwórz **czysty link** (skopiuj sam URL, bez instrukcji):

```
https://github.com/Wojtekom/swh-manager/blob/master/src/app/api/seed-letni/route.ts
```

Tam:
1. Ikonka ołówka ✏️ w prawym górnym rogu nad treścią pliku
2. Ctrl+A, Delete
3. Otwórz mojego nowego `route` (link wyżej), Ctrl+A, Ctrl+C, wróć, Ctrl+V
4. Commit message: `Fix: parent opcjonalny - podplany powstają nawet gdy plan roczny skasowany`
5. Commit changes

Po deploy (~2 min) odpalimy:
```
https://swh-manager.vercel.app/api/seed-letni?key=letni2026
```

Tym razem w odpowiedzi powinno być:
- `Grupa: Mini Hokej (kategoria: U12, id=...)`
- `✓ Utworzono podplan: Mini Hokej — Plan Letni 2026 [groupId=...]`

I po tym Dziennik PZSW pokaże 16 sesji.

Daj znać "wgrane".
