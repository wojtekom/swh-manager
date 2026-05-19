"use client";

import { useEffect, useState, useCallback } from "react";
import { Timer, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";

interface TestDef {
  key: string;
  label: string;
  unit: string;
}

interface PlayerResult {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  groupName: string | null;
  results: Record<string, Record<string, { result: string; testDate: string }>>;
}

const LOWER_IS_BETTER = ["T1_sprint_20m", "T2_slalom", "T3_jazda_tylem_15m", "T5_prowadzenie_slalom", "T6_wytrzymalosc"];

export default function TestRolkarzaPage() {
  const [tests, setTests] = useState<TestDef[]>([]);
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [period, setPeriod] = useState<"start" | "end">("start");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // Pobierz grupy
  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.groups || [];
        setGroups(list);
      })
      .catch(console.error);
  }, []);

  // Pobierz wyniki
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedGroup === "all"
        ? "/api/test-rolkarza"
        : `/api/test-rolkarza?groupId=${selectedGroup}`;
      const res = await fetch(url);
      const data = await res.json();
      setTests(data.tests || []);
      setPlayers(data.players || []);
    } catch (err) {
      console.error("Błąd:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const saveResult = async (playerId: string, testKey: string, value: string) => {
    if (!value.trim()) return;
    const cellKey = `${playerId}-${testKey}-${period}`;
    setSaving(cellKey);
    try {
      await fetch("/api/test-rolkarza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, testType: testKey, period, result: value }),
      });
      // Odśwież lokalnie
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? {
                ...p,
                results: {
                  ...p.results,
                  [testKey]: {
                    ...p.results[testKey],
                    [period]: { result: value, testDate: new Date().toISOString() },
                  },
                },
              }
            : p
        )
      );
    } catch (err) {
      console.error("Błąd zapisu:", err);
    } finally {
      setSaving(null);
    }
  };

  const getDiff = (testKey: string, results: Record<string, { result: string }>) => {
    const s = parseFloat(results?.start?.result);
    const e = parseFloat(results?.end?.result);
    if (isNaN(s) || isNaN(e)) return null;
    const diff = e - s;
    const lowerBetter = LOWER_IS_BETTER.includes(testKey);
    const improved = lowerBetter ? diff < 0 : diff > 0;
    return { diff, improved };
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400">Ładowanie...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Timer className="h-6 w-6 text-orange-500" />
          Test Rolkarza — PZSW
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          6 testów sprawnościowych • Pomiar wstępny (zaj. 6) i końcowy (zaj. 13-14)
        </p>
      </div>

      {/* Filtry */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-400"
          >
            <option value="all">Wszystkie grupy</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          <button
            onClick={() => setPeriod("start")}
            className={`px-4 py-1.5 text-sm font-medium transition ${
              period === "start"
                ? "bg-orange-500 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Pomiar wstępny
          </button>
          <button
            onClick={() => setPeriod("end")}
            className={`px-4 py-1.5 text-sm font-medium transition ${
              period === "end"
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Pomiar końcowy
          </button>
        </div>
      </div>

      {/* Legenda testów */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-800">
        <strong>T1</strong> Sprint 20m • <strong>T2</strong> Slalom • <strong>T3</strong> Jazda tyłem 15m • <strong>T4</strong> Podanie celne ×5 • <strong>T5</strong> Prowadzenie krążka slalom • <strong>T6</strong> Wytrzymałość
      </div>

      {/* Tabela wyników */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-3 text-left sticky left-0 bg-slate-50/80 z-10">Zawodnik</th>
              {tests.map((t) => (
                <th key={t.key} className="px-2 py-3 text-center min-w-[80px]">
                  <div>{t.label.split(" ")[0]}</div>
                  <div className="text-[10px] text-slate-400 normal-case">({t.unit})</div>
                </th>
              ))}
              {period === "end" && (
                <th className="px-2 py-3 text-center min-w-[70px]">Postęp</th>
              )}
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => {
              let improvements = 0;
              let totalDiffs = 0;

              return (
                <tr key={player.id} className={idx > 0 ? "border-t border-slate-100" : ""}>
                  <td className="px-3 py-2 sticky left-0 bg-white z-10">
                    <div className="font-medium text-slate-900 text-sm">
                      {player.lastName} {player.firstName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {player.groupName || player.category}
                    </div>
                  </td>
                  {tests.map((test) => {
                    const cellKey = `${player.id}-${test.key}-${period}`;
                    const currentValue = player.results[test.key]?.[period]?.result || "";
                    const editKey = `${player.id}-${test.key}`;
                    const diff = period === "end" ? getDiff(test.key, player.results[test.key]) : null;

                    if (diff) {
                      totalDiffs++;
                      if (diff.improved) improvements++;
                    }

                    return (
                      <td key={test.key} className="px-2 py-2 text-center">
                        <input
                          type="text"
                          value={editValues[editKey] !== undefined ? editValues[editKey] : currentValue}
                          placeholder="—"
                          onChange={(e) => setEditValues((prev) => ({ ...prev, [editKey]: e.target.value }))}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== currentValue) {
                              saveResult(player.id, test.key, val);
                            }
                            setEditValues((prev) => {
                              const next = { ...prev };
                              delete next[editKey];
                              return next;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            if (e.key === "Tab") {
                              // Auto-save on tab
                              const val = (e.target as HTMLInputElement).value;
                              if (val !== currentValue) {
                                saveResult(player.id, test.key, val);
                              }
                            }
                          }}
                          className={`w-16 text-center text-sm border rounded px-1 py-1 focus:outline-none focus:border-sky-400 ${
                            saving === cellKey ? "bg-sky-50 border-sky-300" : "border-slate-200"
                          } ${currentValue ? "font-medium" : "text-slate-300"}`}
                        />
                        {period === "end" && diff && (
                          <div className={`text-[10px] mt-0.5 font-semibold ${
                            diff.improved ? "text-emerald-600" : "text-red-500"
                          }`}>
                            {diff.diff > 0 ? "+" : ""}{diff.diff.toFixed(1)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {period === "end" && (
                    <td className="px-2 py-2 text-center">
                      {totalDiffs > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {improvements >= totalDiffs / 2 ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : improvements > 0 ? (
                            <Minus className="h-4 w-4 text-amber-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs font-medium text-slate-600">
                            {improvements}/{totalDiffs}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {players.length === 0 && (
          <div className="text-center py-8 text-slate-400">Brak zawodników w wybranej grupie.</div>
        )}
      </div>

      {/* Instrukcja */}
      <div className="mt-4 text-xs text-slate-400 text-center">
        Kliknij w komórkę i wpisz wynik • Tab przechodzi do następnego • Enter zapisuje • Wyniki zapisują się automatycznie
      </div>
    </div>
  );
}
