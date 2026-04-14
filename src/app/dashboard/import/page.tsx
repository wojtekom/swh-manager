"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Users, UserPlus, UsersRound, AlertCircle, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";

interface ImportResult {
  message: string;
  stats: {
    players: number;
    parents: number;
    groups: number;
    skipped: number;
    errors: string[];
    catCounts?: Record<string, number>;
  };
}

interface PreviewRow {
  firstName: string;
  lastName: string;
  birthYear: number | null;
  category: string;
  groupName: string;
  parentName: string;
}

const CAT_STYLES: Record<string, { label: string; years: string; color: string; bg: string; border: string }> = {
  U8:  { label: "Mikrus U8",      years: "ur. 2018-2020", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  U12: { label: "Mini Hokej U12", years: "ur. 2014-2017", color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200" },
  U14: { label: "Młodzik U14",    years: "ur. 2011-2013", color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  U16: { label: "Open U16",       years: "ur. 2010 i starsi", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
};
const CAT_ORDER = ["U8", "U12", "U14", "U16"];

function hlhCategory(year: number | null): { group: string; category: string } {
  if (!year) return { group: "Open", category: "U16" };
  if (year >= 2018 && year <= 2020) return { group: "Mikrus", category: "U8" };
  if (year >= 2014 && year <= 2017) return { group: "Mini Hokej", category: "U12" };
  if (year >= 2011 && year <= 2013) return { group: "Młodzik", category: "U14" };
  return { group: "Open", category: "U16" };
}

function excelDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val === "number") {
    const d = new Date((val - 25569) * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export default function ImportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Tylko administrator może importować dane.</p>
      </div>
    );
  }

  async function handleFileChange(f: File | null) {
    setFile(f);
    setPreview(null);
    setResult(null);
    if (!f) return;

    try {
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];

      const parsed: PreviewRow[] = rows
        .filter((r) => r["Imię"] && r["Nazwisko"])
        .map((r) => {
          const birthDate = excelDate(r["Data urodzenia"]);
          const rocznik = r["Rocznik"] ? Number(r["Rocznik"]) : null;
          const birthYear = birthDate ? birthDate.getFullYear() : rocznik;
          const hlh = hlhCategory(birthYear);
          return {
            firstName: String(r["Imię"] || "").trim(),
            lastName: String(r["Nazwisko"] || "").trim(),
            birthYear,
            category: hlh.category,
            groupName: hlh.group,
            parentName: String(r["Imię i nazwisko rodzica"] || "").trim(),
          };
        });

      setPreview(parsed);
    } catch {
      toast.error("Nie udało się odczytać pliku.");
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok) {
        // Oblicz catCounts z preview
        if (preview) {
          const catCounts: Record<string, number> = {};
          preview.forEach((r) => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
          data.stats.catCounts = catCounts;
        }
        setResult(data);
        setPreview(null);
        toast.success(`Zaimportowano ${data.stats.players} zawodników i ${data.stats.parents} rodziców`);
      } else {
        toast.error(data.error || "Błąd importu");
      }
    } catch {
      toast.error("Błąd połączenia");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Import z SportManago</h1>
        <p className="text-muted-foreground mt-1">
          Zaimportuj listę zawodników i rodziców z pliku Excel eksportowanego ze SportManago.
        </p>
      </div>

      {/* Info o podziale na grupy */}
      <Card className="border-sky-200 bg-sky-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-sky-500" />
            Automatyczny podział na grupy HLH
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Zawodnicy zostaną automatycznie przydzieleni do grup wg kategorii HLH na podstawie rocznika urodzenia:</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {CAT_ORDER.map((cat) => {
              const s = CAT_STYLES[cat];
              return (
                <div key={cat} className={`rounded-lg p-2.5 border ${s.border} ${s.bg}`}>
                  <span className={`font-semibold ${s.color}`}>{s.label}</span>
                  <span className="text-muted-foreground ml-2">{s.years}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wybierz plik</CardTitle>
          <CardDescription>
            Eksportuj listę zawodników ze SportManago do pliku .xlsx i wgraj poniżej.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-sky-200 rounded-xl p-8 cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-colors">
            <FileSpreadsheet className="h-10 w-10 text-sky-400 mb-3" />
            <p className="text-sm font-medium">
              {file ? file.name : "Kliknij aby wybrać plik .xlsx"}
            </p>
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
          </label>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? "Importowanie..." : `Importuj${preview ? ` ${preview.length} zawodników` : ""}`}
          </Button>
        </CardContent>
      </Card>

      {/* Podgląd pliku pogrupowany wg kategorii */}
      {preview && preview.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-5 w-5 text-sky-500" />
              Podgląd importu — {preview.length} zawodników
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {CAT_ORDER.map((cat) => {
              const catRows = preview.filter((r) => r.category === cat);
              if (catRows.length === 0) return null;
              const s = CAT_STYLES[cat];
              return (
                <div key={cat}>
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${s.bg} ${s.border} mb-2`}>
                    <span className={`font-semibold text-sm ${s.color}`}>{s.label}</span>
                    <span className={`text-xs opacity-70 ${s.color}`}>{s.years}</span>
                    <span className={`ml-auto font-semibold text-sm ${s.color}`}>{catRows.length} zaw.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nazwisko i imię</TableHead>
                          <TableHead>Rocznik</TableHead>
                          <TableHead>Rodzic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catRows.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{r.lastName} {r.firstName}</TableCell>
                            <TableCell>{r.birthYear || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{r.parentName || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Wyniki importu */}
      {result && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              {result.message}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox icon={<Users className="h-4 w-4" />} label="Zawodnicy" value={result.stats.players} color="sky" />
              <StatBox icon={<UserPlus className="h-4 w-4" />} label="Rodzice" value={result.stats.parents} color="violet" />
              <StatBox icon={<UsersRound className="h-4 w-4" />} label="Grupy" value={result.stats.groups} color="emerald" />
              <StatBox icon={<AlertCircle className="h-4 w-4" />} label="Pominięci" value={result.stats.skipped} color="amber" />
            </div>

            {/* Podsumowanie per kategoria */}
            {result.stats.catCounts && (
              <div className="flex gap-2 flex-wrap mt-4">
                {CAT_ORDER.map((cat) => {
                  const cnt = result.stats.catCounts?.[cat];
                  if (!cnt) return null;
                  const s = CAT_STYLES[cat];
                  return (
                    <span key={cat} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${s.bg} ${s.border} ${s.color}`}>
                      {s.label}: {cnt}
                    </span>
                  );
                })}
              </div>
            )}

            {result.stats.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm font-medium text-red-700 mb-1">Błędy ({result.stats.errors.length}):</p>
                {result.stats.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instrukcja */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jak eksportować dane ze SportManago?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Zaloguj się do <strong>SportManago</strong></p>
          <p>2. Przejdź do <strong>Zawodnicy</strong> → filtr: <strong>Status: Aktywny</strong></p>
          <p>3. Kliknij <strong>Eksportuj</strong> → <strong>Excel (.xlsx)</strong></p>
          <p>4. Zapisz plik i wgraj powyżej</p>
          <p className="mt-3 text-xs">
            Importowane dane: imię, nazwisko, data urodzenia, PESEL, szkoła, dane rodziców (imię, email, telefon).
            Zawodnicy są automatycznie przypisywani do grup HLH na podstawie rocznika.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div className={`rounded-xl p-3 ${colors[color] || colors.sky}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-70">{icon} {label}</div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
