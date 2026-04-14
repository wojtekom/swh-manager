"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UsersRound, Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  status: string;
}

interface Group {
  id: string;
  name: string;
  category: string;
  members: { player: Player }[];
  _count: { members: number };
}

const CATEGORIES = ["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"];

export default function GroupsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";

  const [groups, setGroups] = useState<Group[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [gRes, pRes] = await Promise.all([
        fetch("/api/groups"),
        fetch("/api/players"),
      ]);
      if (gRes.ok) setGroups(await gRes.json());
      if (pRes.ok) setAllPlayers(await pRes.json());
    } catch {
      toast.error("Błąd pobierania danych");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchData();
  }, [authStatus, router, fetchData]);

  async function handleDeleteGroup(id: string) {
    if (!confirm("Usunąć tę grupę?")) return;
    const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usunięto"); fetchData(); }
  }

  async function handleRemoveMember(groupId: string, playerId: string) {
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    if (res.ok) { toast.success("Usunięto z grupy"); fetchData(); }
  }

  async function handleAddMembers(groupId: string, playerIds: string[]) {
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Dodano ${data.added} zawodników`);
      fetchData();
      setAddMemberOpen(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupy treningowe</h1>
          <p className="text-muted-foreground">{groups.length} grup</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nowa grupa
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak grup. Utwórz pierwszą grupę treningową!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{g.name}</CardTitle>
                  <Badge variant="outline">{g.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {g._count.members} zawodników
                </p>

                {g.members.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {g.members.map((m) => (
                      <div key={m.player.id} className="flex items-center justify-between text-sm py-1">
                        <span>{m.player.lastName} {m.player.firstName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveMember(g.id, m.player.id)}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-1 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddMemberOpen(g.id)}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Dodaj
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(g); setDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(g.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Group Dialog */}
      <GroupDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        group={editing}
        onSaved={fetchData}
      />

      {/* Add Members Dialog */}
      {addMemberOpen && (
        <AddMembersDialog
          groupId={addMemberOpen}
          group={groups.find((g) => g.id === addMemberOpen)!}
          allPlayers={allPlayers}
          onClose={() => setAddMemberOpen(null)}
          onAdd={handleAddMembers}
        />
      )}
    </div>
  );
}

function GroupDialog({
  open, onClose, group, onSaved,
}: {
  open: boolean; onClose: () => void; group: Group | null; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", category: "U12" });

  useEffect(() => {
    if (group) setForm({ name: group.name, category: group.category });
    else setForm({ name: "", category: "U12" });
  }, [group, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = group ? `/api/groups/${group.id}` : "/api/groups";
    const method = group ? "PUT" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success(group ? "Zaktualizowano" : "Utworzono grupę"); onSaved(); onClose(); }
    else toast.error("Błąd zapisu");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{group ? "Edytuj grupę" : "Nowa grupa"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nazwa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="np. Młodziki" required />
          </div>
          <div className="space-y-1">
            <Label>Kategoria wiekowa</Label>
            <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>{loading ? "..." : group ? "Zapisz" : "Utwórz"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMembersDialog({
  groupId, group, allPlayers, onClose, onAdd,
}: {
  groupId: string; group: Group; allPlayers: Player[]; onClose: () => void;
  onAdd: (groupId: string, playerIds: string[]) => void;
}) {
  const existingIds = new Set(group.members.map((m) => m.player.id));
  const available = allPlayers.filter((p) => !existingIds.has(p.id) && p.status === "ACTIVE");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Dodaj do: {group.name}</DialogTitle></DialogHeader>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Wszyscy zawodnicy są już w tej grupie.</p>
        ) : (
          <div className="space-y-2">
            {available.map((p) => (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex items-center justify-between w-full rounded-lg border p-2.5 text-sm transition-colors ${
                  selected.has(p.id) ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
                }`}
              >
                <span>{p.lastName} {p.firstName}</span>
                <Badge variant="outline">{p.category}</Badge>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button disabled={selected.size === 0} onClick={() => onAdd(groupId, [...selected])}>
            Dodaj ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
