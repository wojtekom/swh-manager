"use client";
import { useEffect, useState } from "react";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  dateOfBirth?: string | null;
  group?: { id: string; name: string } | null;
  groupId?: string | null;
  groupName?: string | null;
};

type Group = { id: string; name: string };

export default function EksportZawodnikowPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let arr: Player[] = [];
        const tryUrls = ["/api/players", "/api/zawodnicy", "/api/dashboard/players"];
        let lastErr: string | null = null;
        for (const url of tryUrls) {
          try {
            const r = await fetch(url);
            if (!r.ok) {
              lastErr = `${url}: HTTP ${r.status}`;
              continue;
            }
            const d = await r.json();
            arr = Array.isArray(d) ? d : (d.players || d.data || d.items || []);
            if (arr.length >= 0) {
              lastErr = null;
              break;
            }
          } catch (e) {
            lastErr = `${url}: ${e instanceof Error ? e.message : "blad"}`;
          }
        }
        if (lastErr && arr.length === 0) {
          setError(`Nie znaleziono endpointu z zawodnikami. Ostatni blad: ${lastErr}`);
          return;
        }
        const normalized: Player[] = arr.map((p: Player) => ({
          ...p,
          birthDate: p.birthDate || p.dateOfBirth || null,
          group: p.group || (p.groupId ? { id: p.groupId, name: p.groupName || "Grupa" } : null),
        }));
        setPlayers(normalized);

        const groupMap = new Map<string, Group>();
        normalized.forEach((p) => {
          if (p.group?.id) groupMap.set(p.group.id, p.group);
        });
        setGroups(Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany blad");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered =
    selectedGroup === "all"
      ? players
      : players.filter((p) => p.group?.id === selectedGroup);

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("pl-PL");
    } catch {
      return d;
    }
  };

  const groupLabel =
    selectedGroup === "all"
      ? "wszyscy"
      : groups.find((g) => g.id === selectedGroup)?.name || "grupa";

  const exportCSV = () => {
    const headers = ["Lp.", "Imie", "Nazwisko", "Data urodzenia", "Grupa"];
    const rows = filtered.map((p, i) => [
      i + 1,
      p.firstName || "",
      p.lastName || "",
      formatDate(p.birthDate),
      p.group?.name || "—",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
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
          Wybierz grupe i format. Excel/CSV otworzy sie w Excelu lub Google Sheets.
          PDF: w oknie drukowania wybierz "Zapisz jako PDF".
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
                      const c = players.filter((p) => p.group?.id === g.id).length;
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
            </div>

            <div className="print-area bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">
                  Lista zawodnikow — {groupLabel}
                </h2>
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
                      <td className="px-4 py-2 text-gray-600">{p.group?.name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-8 text-center text-gray-400">Brak zawodnikow do wyswietlenia.</div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
