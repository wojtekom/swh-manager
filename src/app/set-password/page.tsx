"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Shield, Snowflake, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function SetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(!!token);
  const [validToken, setValidToken] = useState(false);
  const [tokenError, setTokenError] = useState(token ? "" : "Brak tokena w linku");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/auth/set-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.valid) {
          setValidToken(true);
          setUserEmail(data.email || "");
          setUserName(data.name || "");
        } else {
          setTokenError(data.reason || "Link jest nieprawidlowy");
        }
      })
      .catch(() => {
        if (!cancelled) setTokenError("Blad polaczenia z serwerem");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Haslo musi miec minimum 8 znakow");
      return;
    }
    if (password !== confirm) {
      setError("Hasla sie roznia");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Nie udalo sie ustawic hasla"
        );
        setSubmitting(false);
        return;
      }
      setDone(true);
      // Automatyczne logowanie po 1.5s
      setTimeout(async () => {
        const result = await signIn("credentials", {
          email: data.email,
          password,
          redirect: false,
        });
        if (result?.ok) {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      }, 1500);
    } catch {
      setError("Blad polaczenia z serwerem");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100">
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-200/30 blur-3xl" />

      <Card className="relative w-full max-w-md shadow-xl shadow-sky-900/5 border-white/60 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 p-4 shadow-lg shadow-sky-500/25">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 rounded-full bg-sky-100 p-1">
                <Snowflake className="h-3.5 w-3.5 text-sky-400" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sky-700 to-blue-600 bg-clip-text text-transparent">
            Aktywacja konta
          </CardTitle>
          <CardDescription className="text-sm">
            Ustaw swoje haslo, aby uzyskac dostep do aplikacji
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              Sprawdzam link...
            </p>
          ) : !validToken ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <strong>Link nie jest prawidlowy.</strong>
                <br />
                {tokenError}
              </div>
              <p className="text-sm text-muted-foreground">
                Popros administratora o wyslanie nowego linku aktywacyjnego
                albo przejdz do strony logowania, jesli masz juz konto.
              </p>
              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="w-full"
              >
                Strona logowania
              </Button>
            </div>
          ) : done ? (
            <div className="py-4 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm">
                Haslo zostalo ustawione. Logujemy Cie automatycznie...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {userName && (
                <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-900">
                  Witaj, <strong>{userName}</strong>
                  <br />
                  <span className="text-xs text-sky-700">{userEmail}</span>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Nowe haslo (min. 8 znakow)
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 rounded-xl bg-white border-sky-100 focus:border-sky-300 focus:ring-sky-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-sm font-medium">
                  Powtorz haslo
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 rounded-xl bg-white border-sky-100 focus:border-sky-300 focus:ring-sky-200"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-semibold shadow-md shadow-sky-500/20 transition-all"
                disabled={submitting}
              >
                {submitting ? "Zapisywanie..." : "Ustaw haslo i zaloguj sie"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Ladowanie...
        </div>
      }
    >
      <SetPasswordInner />
    </Suspense>
  );
}
