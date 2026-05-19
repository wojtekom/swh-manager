"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  category: string;
  status: string;
  groupMembers: { group: { id: string; name: string; category: string } }[];
  _count?: { skillAssessments: number };
}

export default function KartyRozwojuPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.players || [];
        const active = list.filter((p: Player) => p.status === "ACTIVE");
        active.sort((a: Player, b: Player) => a.lastName.localeCompare(b.lastName, "pl"));
        setPlayers(active);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getGroupName = (p: Player) => p.groupMembers?.[0]?.group?.name || "Bez grupy";
  const groups = [...new Set(players.map(getGroupName))].sort();
  const filtered = filter === "all" ? players : players.filter((p) => getGroupName(p) === filter);

  const getBirthYear = (d: string) => new Date(d).getFullYear();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400">Ładowanie...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-sky-500" />
          Karty Rozwoju Zawodników
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Koncepcja Szkoleniowa H. Gruth (2016) • Model hybrydowy lód + rolki
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm rounded-full transition ${
            filter === "all" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Wszyscy ({players.length})
        </button>
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`px-3 py-1.5 text-sm rounded-full transition ${
              filter === g ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {g} ({players.filter((p) => getGroupName(p) === g).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Zawodnik</th>
              <th className="px-4 py-3 text-left">Rocznik</th>
              <th className="px-4 py-3 text-left">Grupa</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => (
              <tr key={player.id} className="border-t border-slate-100 hover:bg-sky-50/50 transition">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900">
                    {player.lastName} {player.firstName}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{getBirthYear(player.dateOfBirth)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    {getGroupName(player)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/karta-rozwoju/${player.id}`}
                    className="text-sm text-sky-600 hover:text-sky-800 font-medium"
                  >
                    Otwórz kartę →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400">Brak zawodników.</div>
        )}
      </div>
    </div>
  );
}
