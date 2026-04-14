"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Plus, UserPlus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface ParentUser {
  id: string;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
  parentPlayers: { player: { id: string; firstName: string; lastName: string } }[];
}

export default function InvitationsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchParents = useCallback(async () => {
    try {
      const res = await fetch("/api/invitations");
      if (res.ok) setParents(await res.json());
    } catch {
      toast.error("Błąd");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") {
      if (session?.user?.role !== "ADMIN") { router.push("/dashboard"); return; }
      fetchParents();
    }
  }, [authStatus, router, session, fetchParents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Zaproszenia rodziców</h1>
          <p className="text-muted-foreground">{parents.length} kont rodzicielskich</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Zaproś rodzica
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : parents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak kont rodzicielskich. Zaproś pierwszego rodzica.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {parents.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.name}</p>
                      <Badge variant={p.active ? "default" : "secondary"}>
                        {p.active ? "Aktywny" : "Nieaktywny"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.email}</p>
                    {p.parentPlayers.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Dzieci: {p.parentPlayers.map((pp) => `${pp.player.firstName} ${pp.player.lastName}`).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Utworzono: {new Date(p.createdAt).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSaved={fetchParents}
      />
    </div>
  );
}

function InviteDialog({
  open, onClose, onSaved,
}: {
  open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", parentName: "", playerName: "" });
  const [result, setResult] = useState<{
    email: string; tempPassword: string; emailSent: boolean; message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ email: "", parentName: "", playerName: "" });
      setResult(null);
      setCopied(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(data.message);
        onSaved();
      } else {
        toast.error(data.error || "Błąd");
      }
    } catch {
      toast.error("Błąd sieci");
    } finally {
      setLoading(false);
    }
  }

  function copyCredentials() {
    if (!result) return;
    navigator.clipboard.writeText(
      `SWH Manager - dane logowania\nEmail: ${result.email}\nHasło: ${result.tempPassword}\nLink: https://swh-manager.vercel.app/login`
    );
    setCopied(true);
    toast.success("Skopiowano do schowka");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zaproś rodzica</DialogTitle>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Imię i nazwisko rodzica</Label>
              <Input
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                placeholder="np. Anna Kowalska"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Email rodzica</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="np. anna@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Imię dziecka (opcjonalnie)</Label>
              <Input
                value={form.playerName}
                onChange={(e) => setForm({ ...form, playerName: e.target.value })}
                placeholder="np. Jan Kowalski"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
              <Button type="submit" disabled={loading}>
                <Mail className="h-4 w-4 mr-1" />
                {loading ? "Wysyłanie..." : "Wyślij zaproszenie"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800 mb-2">
                {result.emailSent
                  ? "Zaproszenie wysłane na email!"
                  : "Konto utworzone (email nie wysłany)"}
              </p>
              <div className="space-y-1 text-sm text-green-700">
                <p>Email: <strong>{result.email}</strong></p>
                <p>Hasło tymczasowe: <strong>{result.tempPassword}</strong></p>
              </div>
            </div>

            {!result.emailSent && (
              <p className="text-sm text-amber-600">
                Email nie został wysłany. Przekaż dane logowania rodzicowi ręcznie (SMS, telefon).
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={copyCredentials}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Skopiowano!" : "Kopiuj dane"}
              </Button>
              <Button onClick={onClose}>Zamknij</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
