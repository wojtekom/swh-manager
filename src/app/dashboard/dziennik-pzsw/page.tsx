"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Download, Printer, Users } from "lucide-react";

interface SkillRef {
  code: string;
  name: string;
  intensity: string;
}

interface ScheduleEntry {
  date: string;
  dateFormatted: string;
  title: string;
  objectives: string | null;
  duration: number;
  skills: SkillRef[];
}

interface PlayerEntry {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  category: string;
  attendance: Record<string, boolean>;
  totalPresent: number;
  totalSessions: number;
  percentPresent: number;
}

interface DiaryData {
  program: string;
  projectPeriod: string;
  group: { name: string; category: string; coach: string | null } | null;
  participantCount: number;
  sessionCount: number;
  players: PlayerEntry[];
  schedule: ScheduleEntry[];
}

export default function DziennikPZSWPage() {
  const [data, setData] = useState<DiaryData | null>(null);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"frekwencja" | "terminarz">("terminarz");

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.groups || [];
        setGroups(list);
        if (list.length > 0) setSelectedGroup(list[0].id);
      })
      .catch(console.error);
  }, []);

  const fetchDiary = useCallback(async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dziennik-pzsw?groupId=${selectedGroup}`);
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchDiary();
  }, [fetchDiary]);

  const exportCSV = () => {
    if (!data) return;
    // Eksport frekwencji do CSV
    const dates = data.schedule.map((s) => s.dateFormatted);
    const header = ["Lp.", "Nazwisko i imię", "Rocznik", ...dates, "Obecności", "%"].join(";");
    const rows = data.players.map((p, i) => {
      const dateVals = data.schedule.map((s) => {
        const dateKey = s.date.split("T")[0];
        const att = p.attendance[dateKey];
        return att === true ? "✓" : att === false ? "N" : "";
      });
      return [i + 1, `${p.lastName} ${p.firstName}`, p.dateOfBirth.slice(0, 4), ...dateVals, p.totalPresent, p.percentPresent + "%"].join(";");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dziennik_pzsw_${data.group?.name || "swh"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400">Ładowanie dziennika...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-teal-500" />
          Dziennik Treningowy PZSW
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Program „Łączą nas rolki" • {data?.projectPeriod || "2026"}
        </p>
      </div>

      {/* Grupa + akcje */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          <button
            onClick={() => setActiveTab("terminarz")}
            className={`px-4 py-1.5 text-sm font-medium transition ${
              activeTab === "terminarz" ? "bg-teal-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Terminarz zajęć
          </button>
          <button
            onClick={() => setActiveTab("frekwencja")}
            className={`px-4 py-1.5 text-sm font-medium transition ${
              activeTab === "frekwencja" ? "bg-teal-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Frekwencja
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <Printer className="h-4 w-4" /> Drukuj
          </button>
        </div>
      </div>

      {/* Info grupy */}
      {data?.group && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-sm text-teal-800 flex flex-wrap gap-6">
          <span><strong>Grupa:</strong> {data.group.name}</span>
          <span><strong>Kategoria:</strong> {data.group.category}</span>
          <span><strong>Trener:</strong> {data.group.coach || "—"}</span>
          <span><strong>Uczestników:</strong> {data.participantCount}</span>
          <span><strong>Zajęć:</strong> {data.sessionCount}</span>
        </div>
      )}

      {/* TERMINARZ ZAJĘĆ */}
      {activeTab === "terminarz" && data && (
        <div className="space-y-3 print:space-y-2">
          {data.schedule.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Brak sesji z przypisanymi datami. Uruchom seed-training-plans.ts.
            </div>
          ) : (
            data.schedule.map((s, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4 print:p-2 print:text-xs">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-mono text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                      Zajęcia {idx + 1}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{s.dateFormatted}</span>
                    <span className="text-xs text-slate-400 ml-2">{s.duration} min</span>
                  </div>
                  {s.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.skills.map((sk) => (
                        <span
                          key={sk.code}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200"
                          title={sk.name}
                        >
                          {sk.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{s.title}</h3>
                {s.objectives && (
                  <p className="text-xs text-slate-500 mt-1">{s.objectives}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* FREKWENCJA */}
      {activeTab === "frekwencja" && data && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider">
                <th className="px-2 py-2 text-left sticky left-0 bg-slate-50/80 z-10">Lp.</th>
                <th className="px-2 py-2 text-left sticky left-[30px] bg-slate-50/80 z-10 min-w-[150px]">Nazwisko i imię</th>
                {data.schedule.map((s, i) => (
                  <th key={i} className="px-1 py-2 text-center min-w-[36px] writing-vertical" title={s.title}>
                    <div className="transform -rotate-45 origin-center text-[10px] whitespace-nowrap">
                      {s.dateFormatted.slice(0, 5)}
                    </div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center">Σ</th>
                <th className="px-2 py-2 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {data.players.map((p, idx) => (
                <tr key={p.id} className={idx > 0 ? "border-t border-slate-50" : ""}>
                  <td className="px-2 py-1.5 text-slate-400 sticky left-0 bg-white z-10">{idx + 1}</td>
                  <td className="px-2 py-1.5 font-medium text-slate-900 sticky left-[30px] bg-white z-10">
                    {p.lastName} {p.firstName}
                  </td>
                  {data.schedule.map((s, i) => {
                    const dateKey = s.date.split("T")[0];
                    const att = p.attendance[dateKey];
                    return (
                      <td key={i} className="px-1 py-1.5 text-center">
                        {att === true ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : att === false ? (
                          <span className="text-red-400">N</span>
                        ) : (
                          <span className="text-slate-200">·</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-center font-semibold text-slate-700">{p.totalPresent}</td>
                  <td className={`px-2 py-1.5 text-center font-semibold ${
                    p.percentPresent >= 80 ? "text-emerald-600" : p.percentPresent >= 50 ? "text-amber-600" : "text-red-500"
                  }`}>
                    {p.percentPresent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.players.length === 0 && (
            <div className="text-center py-8 text-slate-400">Brak zawodników w wybranej grupie.</div>
          )}
        </div>
      )}

      {/* Footer PZSW */}
      <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-400 text-center print:mt-2">
        Dziennik treningowy — Program „Łączą nas rolki" • PZSW / MSiT „Sport Wszystkich Dzieci 2026"
        <br />
        Stowarzyszenie Wybieram Hokej • Siedlce • Grupa: {data?.group?.name || "—"}
      </div>
    </div>
  );
}
