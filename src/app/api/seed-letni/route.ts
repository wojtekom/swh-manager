Stop, nieporozumienie z mojej strony! To **nie jest moduł Szkolenie** — to **Dziennik Treningowy PZSW** (osobny moduł, integracja z programem MSiT "Łączą nas rolki"). I tu komunikat mówi:

> "Brak sesji z przypisanymi datami. **Uruchom seed-training-plans.ts**."

Moje 32 sesje wylądowały w module Szkolenie (TrainingPlan + TrainingSession), a Wojtek od początku miał na myśli **terminarz w Dzienniku PZSW** — to inna część bazy. Sprawdzę co robi `seed-training-plans.ts`:**Mam diagnozę!** Dziennik PZSW filtruje sesje przez `TrainingPlan.groupId`. Mój podplan utworzony przed chwilą **nie ma ustawionego `groupId`** — dlatego dziennik go nie widzi, choć plan istnieje. Plus — grupa "Mini Hokej" w Twojej bazie ma `category=U12`, a nie U10 jak zakładałem.

Naprawiam endpoint — dodaję wyszukanie grupy po nazwie i ustawienie `groupId`:Gotowe. Co zmieniłem:
- Dodałem wyszukiwanie `TrainingGroup` po nazwie (`Mini Hokej`, `Młodzik`)
- Ustawiłem `groupId` na podplanie (kluczowe dla Dziennika PZSW)
- W odpowiedzi seeda zobaczysz dokładnie jaką grupę znalazł (kategorię, id) — to potwierdzi czy wszystko się spina

**Zaktualizuj endpoint na GitHubie:**

1. Pobierz nowy `route.ts` (z linku powyżej)
2. Wejdź w istniejący plik na GitHubie:  
   `https://github.com/Wojtekom/swh-manager/blob/master/src/app/api/seed-letni/route.ts`
3. Kliknij **ikonę ołówka ✏️** "Edit this file"
4. **Ctrl+A → Delete** (skasuj całą zawartość)
5. **Otwórz** mojego nowego `route` w nowej karcie, **Ctrl+A, Ctrl+C**, wróć do edytora GitHub i **Ctrl+V**
6. Przewiń w dół → **"Commit changes"** → wiadomość: `Fix: dodaj groupId do podplanów żeby Dziennik PZSW je zobaczył`
7. **Commit changes**

Po deploy Vercel (~2 min) — odpalimy ponownie:
```
https://swh-manager.vercel.app/api/seed-letni?key=letni2026
```
Tym razem w odpowiedzi zobaczysz `Grupa: Mini Hokej (kategoria: U12, id=...)` co potwierdzi powiązanie. Potem odśwież Dziennik PZSW — sesje powinny się pojawić.

Napisz "wgrane" gdy gotowe.
