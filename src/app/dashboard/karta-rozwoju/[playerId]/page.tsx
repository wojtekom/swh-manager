"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, TrendingUp, Activity } from "lucide-react";

interface Skill {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  sortOrder: number;
  expectedU8?: string;
  expectedU10?: string;
  expectedU12?: string;
  expectedU14?: string;
  assessment?: {
    grade: string;
    assessedAt: string;
    notes?: string;
    assessedBy?: string;
  } | null;
}

interface Category {
  key: string;
  icon: string;
  label: string;
  skills: Skill[];
}

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  category: string;
  groupName?: string;
}

interface FitnessTests {
  [testType: string]: {
    [period: string]: {
      result: string;
      testDate: string;
      notes?: string;
    };
  };
}

const GRADES = ["W", "T", "D", "O"] as const;
const GRADE_LABELS: Record<string, string> = {
  W: "Wprowadzony",
  T: "Trenowany",
  D: "Doskonalony",
  O: "Opanowany",
};
const GRADE_COLORS: Record<string, string> = {
  W: "bg-amber-100 text-amber-800 border-amber-300",
  T: "bg-sky-100 text-sky-800 border-sky-300",
  D: "bg-emerald-100 text-emerald-800 border-emerald-300",
  O: "bg-violet-100 text-violet-800 border-violet-300",
};
const GRADE_ACTIVE: Record<string, string> = {
  W: "bg-amber-500 text-white border-amber-600",
  T: "bg-sky-500 text-white border-sky-600",
  D: "bg-emerald-500 text-white border-emerald-600",
  O: "bg-violet-500 text-white border-violet-600",
};

const FITNESS_TESTS = [
  { key: "sprint_30m", label: "Sprint 30m", unit: "s" },
  { key: "cooper", label: "Test Coopera (6 min)", unit: "m" },
  { key: "skok_w_dal", label: "Skok w dal z miejsca", unit: "cm" },
  { key: "kozlowanie", label: "Kozłowanie piłki (30s)", unit: "razy" },
  { key: "skipping_a", label: "Skipping A (10m)", unit: "s" },
];

const PERIODS = [
  { key: "start", label: "Start" },
  { key: "progress", label: "Postęp" },
  { key: "end", label: "Koniec" },
];

function getExpectedGrade(skill: Skill, category: string): string | null {
  const map: Record<string, string | undefined> = {
    U8: skill.expectedU8,
    U10: skill.expectedU10,
    U12: skill.expectedU12,
    U14: skill.expectedU14,
  };
  return map[category] || null;
}

export default function KartaRozwojuPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params?.playerId as string;

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fitnessTests, setFitnessTests] = useState<FitnessTests>({});
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"skills" | "fitness">("skills");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/development-card/${playerId}`);
      if (!res.ok) throw new Error("Błąd ładowania");
      const data = await res.json();
      setPlayer(data.player);
      setCategories(data.categories);
      setFitnessTests(data.fitnessTests || {});
      setAssessmentCount(data.assessmentCount || 0);
    } catch (err) {
      console.error("Błąd:", err);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) fetchData();
  }, [playerId, fetchData]);

  const saveGrade = async (skillId: string, grade: string) => {
    setSaving(skillId);
    try {
      const res = await fetch(`/api/development-card/${playerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, grade }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            skills: cat.skills.map((s) =>
              s.id === skillId
                ? { ...s, assessment: { grade, assessedAt: new Date().toISOString(), notes: null, assessedBy: null } }
                : s
            ),
          }))
        );
        setAssessmentCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Błąd zapisu:", err);
    } finally {
      setSaving(null);
    }
  };

  const saveFitnessTest = async (testType: string, period: string, result: string) => {
    if (!result.trim()) return;
    try {
      const res = await fetch(`/api/development-card/${playerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType, period, result }),
      });
      if (res.ok) {
        setFitnessTests((prev) => ({
          ...prev,
          [testType]: {
            ...(prev[testType] || {}),
            [period]: { result, testDate: new Date().toISOString() },
          },
        }));
      }
    } catch (err) {
      console.error("Błąd zapisu testu:", err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400">Ładowanie karty...</div>;
  }

  if (!player) {
    return <div className="flex items-center justify-center min-h-[60vh] text-red-400">Zawodnik nie znaleziony</div>;
  }

  const totalSkills = categories.reduce((sum, c) => sum + c.skills.length, 0);
  const assessedSkills = categories.reduce(
    (sum, c) => sum + c.skills.filter((s) => s.assessment).length,
    0
  );
  const progressPct = totalSkills > 0 ? Math.round((assessedSkills / totalSkills) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/karta-rozwoju")}
          className="text-sm text-slate-500 hover:text-sky-600 flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Wróć do listy
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {player.lastName} {player.firstName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {player.groupName || player.category} • Rocznik {new Date(player.dateOfBirth).getFullYear()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-sky-600">{progressPct}%</div>
            <div className="text-xs text-slate-400">
              {assessedSkills}/{totalSkills} ocenionych
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("skills")}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition ${
            activeTab === "skills"
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Umiejętności
        </button>
        <button
          onClick={() => setActiveTab("fitness")}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition ${
            activeTab === "fitness"
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Activity className="h-4 w-4" /> Testy sprawnościowe
        </button>
      </div>

      {/* Legend */}
      {activeTab === "skills" && (
        <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
          <div className="flex flex-wrap gap-3 text-xs">
            {GRADES.map((g) => (
              <span key={g} className={`px-2 py-1 rounded border ${GRADE_COLORS[g]}`}>
                <strong>{g}</strong> — {GRADE_LABELS[g]}
              </span>
            ))}
            <span className="px-2 py-1 rounded border-2 border-dashed border-slate-400 text-slate-500">
              ⎕ = oczekiwany etap wg Grutha
            </span>
          </div>
        </div>
      )}

      {/* Skills */}
      {activeTab === "skills" &&
        categories.map((cat) => {
          const isExpanded = expandedCategory === cat.key || expandedCategory === null;
          const catAssessed = cat.skills.filter((s) => s.assessment).length;

          return (
            <div key={cat.key} className="mb-3">
              <button
                onClick={() =>
                  setExpandedCategory(expandedCategory === cat.key ? null : cat.key)
                }
                className="w-full flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  {cat.label}
                </span>
                <span className="text-xs text-slate-400">
                  {catAssessed}/{cat.skills.length} ocenionych
                </span>
              </button>

              {isExpanded && (
                <div className="mt-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {cat.skills.map((skill, idx) => {
                    const expected = getExpectedGrade(skill, player.category);
                    return (
                      <div
                        key={skill.id}
                        className={`flex items-center gap-3 px-4 py-2.5 ${
                          idx > 0 ? "border-t border-slate-50" : ""
                        } hover:bg-slate-50/50`}
                      >
                        <span className="text-xs text-slate-400 w-8 font-mono">{skill.code}</span>
                        <span className="flex-1 text-sm text-slate-700">{skill.name}</span>
                        <div className="flex gap-1">
                          {GRADES.map((g) => {
                            const isActive = skill.assessment?.grade === g;
                            const isExpectedGrade = expected === g;
                            const isSaving = saving === skill.id;

                            return (
                              <button
                                key={g}
                                onClick={() => saveGrade(skill.id, g)}
                                disabled={isSaving}
                                className={`w-8 h-8 text-xs font-bold rounded border transition ${
                                  isActive
                                    ? GRADE_ACTIVE[g]
                                    : isExpectedGrade
                                    ? `${GRADE_COLORS[g]} border-2 border-dashed`
                                    : "bg-slate-50 text-slate-300 border-slate-200 hover:bg-slate-100"
                                } ${isSaving ? "opacity-50" : ""}`}
                                title={`${GRADE_LABELS[g]}${isExpectedGrade ? " (oczekiwany wg Grutha)" : ""}`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      {/* Fitness Tests */}
      {activeTab === "fitness" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Test</th>
                {PERIODS.map((p) => (
                  <th key={p.key} className="px-3 py-3 text-center">
                    {p.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-center">Różnica</th>
              </tr>
            </thead>
            <tbody>
              {FITNESS_TESTS.map((test, idx) => {
                const testData = fitnessTests[test.key] || {};
                const startVal = parseFloat(testData.start?.result || "");
                const endVal = parseFloat(testData.end?.result || "");
                const diff = !isNaN(startVal) && !isNaN(endVal) ? endVal - startVal : null;

                return (
                  <tr key={test.key} className={idx > 0 ? "border-t border-slate-100" : ""}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{test.label}</span>
                      <span className="text-xs text-slate-400 ml-1">({test.unit})</span>
                    </td>
                    {PERIODS.map((p) => {
                      const val = testData[p.key]?.result || "";
                      return (
                        <td key={p.key} className="px-3 py-3 text-center">
                          <input
                            type="text"
                            defaultValue={val}
                            placeholder="—"
                            className="w-20 text-center text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-sky-400"
                            onBlur={(e) => {
                              if (e.target.value !== val) {
                                saveFitnessTest(test.key, p.key, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      {diff !== null ? (
                        <span
                          className={`text-sm font-semibold ${
                            diff > 0
                              ? "text-emerald-600"
                              : diff < 0
                              ? test.key === "sprint_30m" || test.key === "skipping_a"
                                ? "text-emerald-600"
                                : "text-red-500"
                              : "text-slate-400"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 text-center">
        SWH Siedlce • Koncepcja Szkoleniowa H. Gruth (2016) • Model hybrydowy lód + rolki
      </div>
    </div>
  );
}
