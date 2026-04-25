"use client";
import { useEffect, useState } from "react";

type AnyObj = Record<string, unknown>;
type Player = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  raw?: AnyObj;
};
type Group = { id: string; name: string };

function pick(obj: AnyObj, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
}

function extractGroup(p: AnyObj): { id: string | null; name: string | null } {
  // Możliwe pola obiektu grupy zagnieżdżonego
  const nested = (pick(p, ["group", "team", "druzyna", "grupa", "kategoria", "category", "trainingGroup", "ageGroup"]) as AnyObj | null);
  if (nested && typeof nested === "object") {
    const id = (pick(nested, ["id", "_id", "uuid"]) as string) || null;
    const name = (pick(nested, ["name", "nazwa", "label", "title", "displayName"]) as string) || null;
    if (id || name) return { id: id || name, name: name || id };
  }
  // Płaskie pola
  const id = (pick(p, ["groupId", "teamId", "druzynaId", "grupaId", "kategoriaId", "categoryId", "trainingGroupId", "ageGroupId"]) as string) || null;
  const name = (pick(p, ["groupName", "teamName", "druzynaNazwa", "grupaNazwa", "kategoriaNazwa", "categoryName", "ageCategory", "ageGroupName", "kategoriaWiekowa"]) as string) || null;
  return { id: id || name, name: name || id };
}

export default function EksportZawodnikowPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiag, setShowDiag] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let arr: AnyObj[] = [];
        const tryUrls = ["/api/players", "/api/zawodnicy", "/api/dashboard/players"];
        for (const url of tryUrls) {
          try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const d = await r.json();
            arr = Array.isArray(d) ? d : ((d.players as AnyObj[]) || (d.data as AnyObj[]) || (d.items as AnyObj[]) || []);
            if (arr.length > 0) break;
          } catch {}
        }
        if (arr.length === 0) {
          setError("Nie udalo sie pobrac listy zawodnikow z zadnego endpointu");
          return;
        }
        const normalized: Player[] = arr.map((p) => {
          const g = extractGroup(p);
          return {
            id: (pick(p, ["id", "_id", "uuid"]) as string) || Math.random().toString(36),
            firstName: (pick(p, ["firstName", "firstname", "imie", "imię", "name", "givenName"]) as string) || "",
            lastName: (pick(p, ["lastName", "lastname", "nazwisko", "surname", "familyName"]) as string) || "",
            birthDate: (pick(p, ["birthDate", "dateOfBirth", "dataUrodzenia", "birthday", "dob", "born"]) as string) || null,
            groupId: g.id,
            groupName: g.name,
            raw: p,
          };
        });
        setPlayers(normalized);

        const gMap = new Map<string, Group>();
        normalized.forEach((p) => {
          if (p.groupId && p.groupName) gMap.set(p.groupId, { id: p.groupId, name: p.groupName });
        });
        setGroups(Array.from(gMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany blad");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = selectedGroup === "all" ? players : players.filter((p) => p.groupId === selectedGroup);

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("pl-PL");
    } catch {
      return d;
    }
  };

  const groupLabel = selectedGroup === "all" ? "wszyscy" : groups.find((g) => g.id === selectedGroup)?.name || "grupa";

  const exportCSV = () => {
    const headers = ["Lp.", "Imie", "Nazwisko", "Data urodzenia", "Grupa"];
    const rows = filtered.map((p, i) => [i + 1, p.firstName, p.lastName, formatDate(p.birthDate), p.groupName || "—"]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zawodnicy-${groupLabel}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => window.print();

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 no-print">Eksport list zawodnikow</h1>
        <p className="text-gray-600 mb-6 no-print">
          Wybierz grupe i format. Excel/CSV otworzy sie w Excelu lub Google Sheets. PDF: w oknie drukowania wybierz "Zapisz jako PDF".
        </p>

        {loading && <p className="no-print">Pobieram zawodnikow...</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 no-print">
            <strong>Blad:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm no-print">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Grupa</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="all">Wszyscy ({players.length})</option>
                    {groups.map((g) => {
                      const c = players.filter((p) => p.groupId === g.id).length;
                      return (
                        <option key={g.id} value={g.id}>
                          {g.name} ({c})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button
                  onClick={exportCSV}
                  disabled={filtered.length === 0}
                  className="h-10 px-4 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Pobierz Excel/CSV ({filtered.length})
                </button>
                <button
                  onClick={exportPDF}
                  disabled={filtered.length === 0}
                  className="h-10 px-4 rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Drukuj/PDF ({filtered.length})
                </button>
              </div>
              {groups.length === 0 && (
                <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Nie udalo sie wykryc grup w danych z API.
                  <button onClick={() => setShowDiag(!showDiag)} className="ml-2 underline">
                    {showDiag ? "Ukryj" : "Pokaz"} diagnostyke
                  </button>
                </div>
              )}
              {showDiag && players[0]?.raw && (
                <pre className="mt-3 text-xs bg-gray-900 text-green-300 p-3 rounded overflow-x-auto max-h-60">
                  {JSON.stringify(players[0].raw, null, 2)}
                </pre>
              )}
            </div>

            <div className="print-area bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Lista zawodnikow — {groupLabel}</h2>
                <span className="text-sm text-gray-500">{filtered.length} zawodnikow</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-2 w-12">Lp.</th>
                    <th className="px-4 py-2">Imie</th>
                    <th className="px-4 py-2">Nazwisko</th>
                    <th className="px-4 py-2">Data urodzenia</th>
                    <th className="px-4 py-2">Grupa</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2">{p.firstName}</td>
                      <td className="px-4 py-2 font-medium">{p.lastName}</td>
                      <td className="px-4 py-2 text-gray-600">{formatDate(p.birthDate)}</td>
                      <td className="px-4 py-2 text-gray-600">{p.groupName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="p-8 text-center text-gray-400">Brak zawodnikow do wyswietlenia.</div>}
            </div>
          </>
        )}
      </div>
    </>
  );
}
