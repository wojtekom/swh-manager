"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Activity, Save } from "lucide-react";

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

interface FitnessResult {
  testCode: string;
  rawValue: number | null;
  grade: number | null;
  notes?: string;
}

// ==================== HC+ČSLH TEST DEFINITIONS ====================

interface TestDef {
  code: string;
  name: string;
  unit: string;
  dir: "asc" | "desc";
  t4: number;
  t3: number;
  t2: number;
}

const TESTS_U10: TestDef[] = [
  { code: "T1", name: "Skok w dal",     unit: "cm", dir: "asc",  t4: 145,  t3: 125,  t2: 105  },
  { code: "T2", name: "MB Toss 1 kg",   unit: "m",  dir: "asc",  t4: 4.2,  t3: 3.2,  t2: 2.2  },
  { code: "T3", name: "5-10-5 Shuttle", unit: "s",  dir: "desc", t4: 10.2, t3: 11.2, t2: 12.3 },
  { code: "T4", name: "Sit & Reach",    unit: "cm", dir: "asc",  t4: 14,   t3: 8,    t2: 4    },
  { code: "T5", name: "Równowaga",      unit: "s",  dir: "asc",  t4: 42,   t3: 28,   t2: 14   },
  { code: "T6", name: "Léger Shuttle",  unit: "lv", dir: "asc",  t4: 8,    t3: 6,    t2: 4    },
  { code: "T7", name: "T-Test",         unit: "s",  dir: "desc", t4: 11.5, t3: 12.5, t2: 13.5 },
];

const TESTS_U15: TestDef[] = [
  { code: "T1", name: "Skok w dal",       unit: "cm", dir: "asc",  t4: 210,  t3: 185,  t2: 160  },
  { code: "T2", name: "Sprint 40m",       unit: "s",  dir: "desc", t4: 5.0,  t3: 5.4,  t2: 5.9  },
  { code: "T3", name: "Illinois",         unit: "s",  dir: "desc", t4: 14.8, t3: 15.7, t2: 16.8 },
  { code: "T4", name: "Bench Press 60%",  unit: "n",  dir: "asc",  t4: 10,   t3: 7,    t2: 4    },
  { code: "T5", name: "MB Toss 3 kg",     unit: "m",  dir: "asc",  t4: 7.0,  t3: 5.5,  t2: 4.0  },
  { code: "T6", name: "Léger / 1500m",    unit: "lv", dir: "asc",  t4: 12,   t3: 10,   t2: 8    },
  { code: "T7", name: "RHIET drop",       unit: "%",  dir: "desc", t4: 3,    t3: 6,    t2: 12   },
];

function getTests(category: string): TestDef[] {
  return ["U8", "U10"].includes(category) ? TESTS_U10 : TESTS_U15;
}

function calcGrade(test: TestDef, value: number): number {
  if (test.dir === "asc") {
    if (value >= test.t4) return 4;
    if (value >= test.t3) return 3;
    if (value >= test.t2) return 2;
    return 1;
  } else {
    if (value <= test.t4) return 4;
    if (value <= test.t3) return 3;
    if (value <= test.t2) return 2;
    return 1;
  }
}

const GRADE_BADGE: Record<number, string> = {
  4: "bg-green-100 text-green-800 border-green-300",
  3: "bg-sky-100 text-sky-800 border-sky-300",
  2: "bg-amber-100 text-amber-800 border-amber-300",
  1: "bg-red-100 text-red-800 border-red-300",
};

const GRADE_LABEL: Record<number, string> = {
  4: "Bardzo dobry",
  3: "Dobry",
  2: "Przeciętny",
  1: "Do poprawy",
};

// ==================== SKILL CONSTANTS ====================

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

function getExpectedGrade(skill: Skill, category: string): string | null {
  const map: Record<string, string | undefined> = {
    U8: skill.expectedU8,
    U10: skill.expectedU10,
    U12: skill.expectedU12,
    U14: skill.expectedU14,
  };
  return map[category] || null;
}

// ==================== COMPONENT ====================

export default function KartaRozwojuPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params?.playerId as string;

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"skills" | "fitness">("skills");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [assessmentCount, setAssessmentCount] = useState(0);

  // Fitness state
  const now = new Date();
  const [fitnessYear, setFitnessYear] = useState(now.getFullYear());
  const [fitnessMonth, setFitnessMonth] = useState(now.getMonth() + 1);
  const [fitnessResults, setFitnessResults] = useState<FitnessResult[]>([]);
  const [fitnessLoading, setFitnessLoading] = useState(false);
  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [savingTest, setSavingTest] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/development-card/${playerId}`);
      if (!res.ok) throw new Error("Błąd ładowania");
      const data = await res.json();
      setPlayer(data.player);
      setCategories(data.categories);
      setAssessmentCount(data.assessmentCount || 0);
    } catch (err) {
      console.error("Błąd:", err);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const fetchFitness = useCallback(async () => {
    setFitnessLoading(true);
    setPendingValues({});
    try {
      const res = await fetch(`/api/fitness-tests?playerId=${playerId}&year=${fitnessYear}`);
      if (!res.ok) throw new Error();
      const data: FitnessResult[] = await res.json();
      setFitnessResults(data.filter((r) => r.testCode.startsWith("T") && parseInt(r.testCode.slice(1)) <= 7));
    } catch {
      setFitnessResults([]);
    } finally {
      setFitnessLoading(false);
    }
  }, [playerId, fitnessYear]);

  useEffect(() => {
    if (playerId) fetchData();
  }, [playerId, fetchData]);

  useEffect(() => {
    if (playerId && activeTab === "fitness") fetchFitness();
  }, [playerId, activeTab, fitnessYear, fetchFitness]);

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
                ? { ...s, assessment: { grade, assessedAt: new Date().toISOString(), notes: undefined, assessedBy: undefined } }
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

  const saveFitnessValue = async (testCode: string, rawInput: string) => {
    const rawValue = rawInput === "" ? null : parseFloat(rawInput);
    if (rawInput !== "" && isNaN(rawValue!)) return;

    const tests = player ? getTests(player.category) : TESTS_U15;
    const test = tests.find((t) => t.code === testCode);
    const grade = rawValue != null && test ? calcGrade(test, rawValue) : null;

    setSavingTest(testCode);
    try {
      const res = await fetch("/api/fitness-tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, year: fitnessYear, month: fitnessMonth, testCode, rawValue, grade }),
      });
      if (res.ok) {
        const saved: FitnessResult = await res.json();
        setFitnessResults((prev) => {
          const idx = prev.findIndex((r) => r.testCode === testCode);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { testCode, rawValue: saved.rawValue, grade: saved.grade };
            return next;
          }
          return [...prev, { testCode, rawValue: saved.rawValue, grade: saved.grade }];
        });
        setPendingValues((p) => { const n = { ...p }; delete n[testCode]; return n; });
      }
    } catch (err) {
      console.error("Błąd zapisu testu:", err);
    } finally {
      setSavingTest(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400">Ładowanie karty...</div>;
  }

  if (!player) {
    return <div className="flex items-center justify-center min-h-[60vh] text-red-400">Zawodnik nie znaleziony</div>;
  }

  const totalSkills = categories.reduce((sum, c) => sum + c.skills.length, 0);
  const assessedSkills = categories.reduce((sum, c) => sum + c.skills.filter((s) => s.assessment).length, 0);
  const progressPct = totalSkills > 0 ? Math.round((assessedSkills / totalSkills) * 100) : 0;

  const tests = getTests(player.category);
  const resultMap = Object.fromEntries(fitnessResults.map((r) => [r.testCode, r]));

  const MONTHS = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

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
            <div className="text-xs text-slate-400">{assessedSkills}/{totalSkills} ocenionych</div>
          </div>
        </div>
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
            activeTab === "skills" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Umiejętności
        </button>
        <button
          onClick={() => setActiveTab("fitness")}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition ${
            activeTab === "fitness" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Activity className="h-4 w-4" /> Testy sprawnościowe
        </button>
      </div>

      {/* ==================== SKILLS TAB ==================== */}
      {activeTab === "skills" && (
        <>
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

          {categories.map((cat) => {
            const isExpanded = expandedCategory === cat.key || expandedCategory === null;
            const catAssessed = cat.skills.filter((s) => s.assessment).length;

            return (
              <div key={cat.key} className="mb-3">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
                  className="w-full flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 transition"
                >
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    {cat.label}
                  </span>
                  <span className="text-xs text-slate-400">{catAssessed}/{cat.skills.length} ocenionych</span>
                </button>

                {isExpanded && (
                  <div className="mt-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {cat.skills.map((skill, idx) => {
                      const expected = getExpectedGrade(skill, player.category);
                      return (
                        <div
                          key={skill.id}
                          className={`flex items-center gap-3 px-4 py-2.5 ${idx > 0 ? "border-t border-slate-50" : ""} hover:bg-slate-50/50`}
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
        </>
      )}

      {/* ==================== FITNESS TAB ==================== */}
      {activeTab === "fitness" && (
        <div className="space-y-4">
          {/* Year/month selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Rok:</span>
              <select
                value={fitnessYear}
                onChange={(e) => setFitnessYear(parseInt(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-sm font-medium text-slate-600">Miesiąc:</span>
              <div className="flex flex-wrap gap-1">
                {MONTHS.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setFitnessMonth(i + 1)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                      fitnessMonth === i + 1
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Standard: {["U8", "U10"].includes(player.category) ? "HC LTAD (U10)" : "HC+ČSLH (U15)"}
              {" • "}Nowe wartości zapisują się po wpisaniu i kliknięciu poza pole
            </p>
          </div>

          {/* Tests table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {fitnessLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Ładowanie wyników...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3 text-left w-8">#</th>
                    <th className="px-4 py-3 text-left">Test</th>
                    <th className="px-3 py-3 text-center">Jedn.</th>
                    <th className="px-3 py-3 text-center w-28">Wartość</th>
                    <th className="px-3 py-3 text-center">Ocena</th>
                    <th className="px-3 py-3 text-center hidden md:table-cell">Normy (1→4)</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test, idx) => {
                    const r = resultMap[test.code];
                    const pendingRaw = pendingValues[test.code];
                    const displayValue = pendingRaw !== undefined ? pendingRaw : r?.rawValue != null ? String(r.rawValue) : "";
                    const grade = r?.grade ?? null;
                    const isSaving = savingTest === test.code;

                    return (
                      <tr key={test.code} className={`${idx > 0 ? "border-t border-slate-100" : ""} hover:bg-slate-50/50`}>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{test.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{test.name}</td>
                        <td className="px-3 py-3 text-center text-slate-500">{test.unit}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              step="any"
                              value={displayValue}
                              placeholder="—"
                              onChange={(e) =>
                                setPendingValues((p) => ({ ...p, [test.code]: e.target.value }))
                              }
                              onBlur={(e) => {
                                if (pendingValues[test.code] !== undefined) {
                                  saveFitnessValue(test.code, e.target.value);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-20 text-center border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                            />
                            {isSaving && <Save className="h-3 w-3 text-sky-400 animate-pulse" />}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {grade != null ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${GRADE_BADGE[grade]}`}>
                              {grade} — {GRADE_LABEL[grade]}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center hidden md:table-cell">
                          <span className="text-xs text-slate-400">
                            {test.dir === "asc"
                              ? `≥${test.t2} / ≥${test.t3} / ≥${test.t4}`
                              : `≤${test.t2} / ≤${test.t3} / ≤${test.t4}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="text-xs text-slate-400 text-center">
            Źródła: HC NSST & Fitness Testing Protocols • ČSLH Motorické testy U15 (FTVS Praha)
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 text-center">
        SWH Siedlce • Koncepcja Szkoleniowa H. Gruth (2016) • Model hybrydowy lód + rolki
      </div>
    </div>
  );
}
