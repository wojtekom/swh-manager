"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, CheckCircle2, Users, Phone, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "U8", label: "U8", desc: "do 8 lat (rocznik 2018+)" },
  { value: "U10", label: "U10", desc: "do 10 lat (rocznik 2016–2017)" },
  { value: "U12", label: "U12", desc: "do 12 lat (rocznik 2014–2015)" },
  { value: "U14", label: "U14", desc: "do 14 lat (rocznik 2012–2013)" },
  { value: "U16", label: "U16", desc: "do 16 lat (rocznik 2010–2011)" },
  { value: "U18", label: "U18", desc: "do 18 lat (rocznik 2008–2009)" },
  { value: "SENIOR", label: "Seniorzy", desc: "18+ lat" },
];

const HOW_FOUND_OPTIONS = [
  "Facebook / Instagram",
  "Strona internetowa",
  "Znajomi / rodzina",
  "Szkoła",
  "Wydarzenie sportowe",
  "Inne",
];

export function RecruitmentForm() {
  const searchParams = useSearchParams();
  const preselectedCategory = searchParams.get("grupa");

  const [step, setStep] = useState<"select" | "form" | "success">(
    preselectedCategory ? "form" : "select"
  );
  const [selectedCategory, setSelectedCategory] = useState(
    preselectedCategory?.toUpperCase() || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    childFirstName: "",
    childLastName: "",
    childBirthDate: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    experience: "",
    healthNotes: "",
    howFound: "",
    message: "",
    consentHealth: false,
    consentImage: false,
    consentTravel: false,
    consentGoodPractice: false,
    consentData: false,
  });

  function selectCategory(cat: string) {
    setSelectedCategory(cat);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: selectedCategory,
        }),
      });

      if (res.ok) {
        setStep("success");
      } else {
        const data = await res.json();
        if (data.error?.fieldErrors) {
          const msgs = Object.values(data.error.fieldErrors).flat().join(", ");
          setError(msgs || "Sprawdź poprawność formularza.");
        } else {
          setError("Wystąpił błąd. Spróbuj ponownie.");
        }
      }
    } catch {
      setError("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  }

  const catInfo = CATEGORIES.find((c) => c.value === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-white/20 p-3">
              <Shield className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Stowarzyszenie Wybieram Hokej
          </h1>
          <p className="text-blue-100 text-lg">Siedlce</p>
          <p className="text-blue-200 mt-3 text-sm max-w-md mx-auto">
            Zapraszamy do zapisania dziecka na treningi hokeja na lodzie!
            Prowadzimy nabory do wszystkich grup wiekowych.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Category Selection */}
        {step === "select" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-6">
              Wybierz grupę wiekową
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => selectCategory(cat.value)}
                  className="flex items-center gap-4 rounded-xl border-2 border-transparent bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                    {cat.label}
                  </div>
                  <div>
                    <p className="font-semibold">{cat.label}</p>
                    <p className="text-sm text-muted-foreground">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === "form" && (
          <Card className="shadow-lg">
            <CardHeader>
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 mb-2"
                onClick={() => setStep("select")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zmień grupę
              </Button>
              <CardTitle className="text-xl">
                Formularz naboru — {catInfo?.label}
              </CardTitle>
              <CardDescription>{catInfo?.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Dane dziecka */}
                <fieldset className="space-y-4">
                  <legend className="text-base font-semibold flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Dane dziecka / zawodnika
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="childFirstName">Imię *</Label>
                      <Input
                        id="childFirstName"
                        value={form.childFirstName}
                        onChange={(e) =>
                          setForm({ ...form, childFirstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="childLastName">Nazwisko *</Label>
                      <Input
                        id="childLastName"
                        value={form.childLastName}
                        onChange={(e) =>
                          setForm({ ...form, childLastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="childBirthDate">Data urodzenia *</Label>
                    <Input
                      id="childBirthDate"
                      type="date"
                      value={form.childBirthDate}
                      onChange={(e) =>
                        setForm({ ...form, childBirthDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="experience">
                      Doświadczenie hokejowe / łyżwiarskie
                    </Label>
                    <Input
                      id="experience"
                      value={form.experience}
                      onChange={(e) =>
                        setForm({ ...form, experience: e.target.value })
                      }
                      placeholder="np. 2 lata nauki jazdy na łyżwach"
                    />
                  </div>
                </fieldset>

                {/* Dane rodzica */}
                <fieldset className="space-y-4">
                  <legend className="text-base font-semibold flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    Dane rodzica / opiekuna
                  </legend>
                  <div className="space-y-1">
                    <Label htmlFor="parentName">Imię i nazwisko *</Label>
                    <Input
                      id="parentName"
                      value={form.parentName}
                      onChange={(e) =>
                        setForm({ ...form, parentName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="parentEmail">Email *</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        value={form.parentEmail}
                        onChange={(e) =>
                          setForm({ ...form, parentEmail: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="parentPhone">Telefon *</Label>
                      <Input
                        id="parentPhone"
                        type="tel"
                        value={form.parentPhone}
                        onChange={(e) =>
                          setForm({ ...form, parentPhone: e.target.value })
                        }
                        placeholder="np. 600 123 456"
                        required
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Dodatkowe */}
                <fieldset className="space-y-4">
                  <legend className="text-base font-semibold flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Dodatkowe informacje
                  </legend>
                  <div className="space-y-1">
                    <Label htmlFor="healthNotes">
                      Uwagi zdrowotne (alergie, choroby, kontuzje)
                    </Label>
                    <Textarea
                      id="healthNotes"
                      value={form.healthNotes}
                      onChange={(e) =>
                        setForm({ ...form, healthNotes: e.target.value })
                      }
                      placeholder="Opcjonalnie"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="howFound">
                      Skąd dowiedzieliście się o naszym klubie?
                    </Label>
                    <Select
                      value={form.howFound}
                      onValueChange={(v) => v && setForm({ ...form, howFound: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz..." />
                      </SelectTrigger>
                      <SelectContent>
                        {HOW_FOUND_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="message">Dodatkowa wiadomość</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      placeholder="Opcjonalnie"
                      rows={3}
                    />
                  </div>
                </fieldset>

                {/* Zgody i oświadczenia */}
                <fieldset className="space-y-3">
                  <legend className="text-base font-semibold flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    Wymagane zgody i oświadczenia
                  </legend>

                  <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.consentHealth}
                      onChange={(e) => setForm({ ...form, consentHealth: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      required
                    />
                    <span className="text-sm">
                      <strong>Oświadczenie o stanie zdrowia *</strong>
                      <br />
                      Oświadczam, że moje dziecko jest zdrowe i nie ma przeciwwskazań
                      zdrowotnych do uprawiania hokeja na lodzie. Zobowiązuję się do
                      niezwłocznego poinformowania klubu o jakichkolwiek zmianach stanu
                      zdrowia dziecka.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.consentImage}
                      onChange={(e) => setForm({ ...form, consentImage: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      required
                    />
                    <span className="text-sm">
                      <strong>Zgoda na wykorzystanie wizerunku *</strong>
                      <br />
                      Wyrażam zgodę na utrwalanie i rozpowszechnianie wizerunku mojego
                      dziecka w materiałach promocyjnych klubu, na stronie internetowej
                      oraz w mediach społecznościowych Stowarzyszenia Wybieram Hokej.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.consentTravel}
                      onChange={(e) => setForm({ ...form, consentTravel: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      required
                    />
                    <span className="text-sm">
                      <strong>Zgoda na udział w meczach i turniejach wyjazdowych *</strong>
                      <br />
                      Wyrażam zgodę na udział mojego dziecka w meczach, turniejach
                      i wyjazdach organizowanych przez klub, w tym na wyjazdy pod opieką
                      trenerów i opiekunów wyznaczonych przez Stowarzyszenie.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.consentGoodPractice}
                      onChange={(e) => setForm({ ...form, consentGoodPractice: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      required
                    />
                    <span className="text-sm">
                      <strong>Akceptacja regulaminu i zasad dobrych praktyk *</strong>
                      <br />
                      Zapoznałem/am się z regulaminem Stowarzyszenia Wybieram Hokej
                      oraz zasadami dobrych praktyk obowiązującymi w klubie (zasady
                      fair play, szacunek dla trenerów i kolegów, punktualność,
                      odpowiedzialność za sprzęt) i zobowiązuję się do ich przestrzegania.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.consentData}
                      onChange={(e) => setForm({ ...form, consentData: e.target.checked })}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      required
                    />
                    <span className="text-sm">
                      <strong>Zgoda na przetwarzanie danych osobowych *</strong>
                      <br />
                      Wyrażam zgodę na przetwarzanie danych osobowych moich oraz mojego
                      dziecka przez Stowarzyszenie Wybieram Hokej w Siedlcach w celu
                      realizacji procesu naboru, organizacji zajęć sportowych oraz
                      kontaktu w sprawach związanych z działalnością klubu, zgodnie
                      z RODO.
                    </span>
                  </label>
                </fieldset>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Wysyłanie..." : "Wyślij zgłoszenie"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <Card className="shadow-lg text-center">
            <CardContent className="py-12 space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Dziękujemy za zgłoszenie!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Twoje zgłoszenie do grupy <strong>{catInfo?.label}</strong>{" "}
                zostało przyjęte. Skontaktujemy się z Tobą telefonicznie lub
                mailowo w ciągu kilku dni roboczych.
              </p>
              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("select");
                    setForm({
                      childFirstName: "",
                      childLastName: "",
                      childBirthDate: "",
                      parentName: "",
                      parentEmail: "",
                      parentPhone: "",
                      experience: "",
                      healthNotes: "",
                      howFound: "",
                      message: "",
                      consentHealth: false,
                      consentImage: false,
                      consentTravel: false,
                      consentGoodPractice: false,
                      consentData: false,
                    });
                  }}
                >
                  Zapisz kolejne dziecko
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted-foreground border-t mt-8">
        <p>&copy; {new Date().getFullYear()} Stowarzyszenie Wybieram Hokej — Siedlce</p>
      </footer>
    </div>
  );
}
