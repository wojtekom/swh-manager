"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Group {
  id: string;
  name: string;
  category: string;
}

interface Response {
  id: string;
  response: string;
  comment: string | null;
  user: { id: string; name: string };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string; role: string };
  group: { id: string; name: string; category: string } | null;
  responses: Response[];
  _count: { responses: number };
}

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  INFO: { label: "Info", color: "bg-blue-100 text-blue-700" },
  TRAINING: { label: "Trening", color: "bg-green-100 text-green-700" },
  MATCH: { label: "Mecz", color: "bg-orange-100 text-orange-700" },
  RSVP: { label: "Potwierdzenie", color: "bg-purple-100 text-purple-700" },
};

export default function AnnouncementsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const isAdminOrCoach = session?.user?.role === "ADMIN" || session?.user?.role === "COACH";
  const userId = session?.user?.id;

  const [items, setItems] = useState<Announcement[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [aRes, gRes] = await Promise.all([
        fetch("/api/announcements"),
        fetch("/api/groups"),
      ]);
      if (aRes.ok) setItems(await aRes.json());
      if (gRes.ok) {
        const data = await gRes.json();
        setGroups(data.map((g: Group) => ({ id: g.id, name: g.name, category: g.category })));
      }
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

  const filtered = items.filter(
    (a) => filterGroup === "ALL" || a.group?.id === filterGroup || !a.group
  );

  async function handleDelete(id: string) {
    if (!confirm("Usunąć ogłoszenie?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Usunięto"); fetchData(); }
  }

  async function handleRespond(announcementId: string, response: string) {
    const res = await fetch(`/api/announcements/${announcementId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    if (res.ok) { toast.success("Odpowiedź zapisana"); fetchData(); }
  }

  async function togglePin(id: string, currentPinned: boolean) {
    await fetch(`/api/announcements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !currentPinned }),
    });
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ogłoszenia</h1>
          <p className="text-muted-foreground">{items.length} ogłoszeń</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterGroup} onValueChange={(v) => v && setFilterGroup(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Grupa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdminOrCoach && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nowe ogłoszenie
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Ładowanie...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brak ogłoszeń.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const typeInfo = TYPE_MAP[a.type] || TYPE_MAP.INFO;
            const myResponse = a.responses.find((r) => r.user.id === userId);
            const yesCount = a.responses.filter((r) => r.response === "yes").length;
            const noCount = a.responses.filter((r) => r.response === "no").length;
            const maybeCount = a.responses.filter((r) => r.response === "maybe").length;
            const isExpanded = expandedId === a.id;

            return (
              <Card key={a.id} className={a.pinned ? "border-2 border-yellow-400" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {a.pinned && <Pin className="h-4 w-4 text-yellow-600" />}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {a.group && (
                          <Badge variant="outline" className="text-xs">
                            {a.group.name}
                          </Badge>
                        )}
                        {!a.group && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" /> Wszyscy
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                    </div>
                    {isAdminOrCoach && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => togglePin(a.id, a.pinned)}>
                          <Pin className={`h-3.5 w-3.5 ${a.pinned ? "text-yellow-600" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap">{a.content}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{a.author.name} &middot; {new Date(a.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  {/* RSVP Section */}
                  {a.type === "RSVP" && (
                    <div className="border-t pt-3 space-y-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={myResponse?.response === "yes" ? "default" : "outline"}
                          onClick={() => handleRespond(a.id, "yes")}
                          className="gap-1"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" /> Tak ({yesCount})
                        </Button>
                        <Button
                          size="sm"
                          variant={myResponse?.response === "no" ? "destructive" : "outline"}
                          onClick={() => handleRespond(a.id, "no")}
                          className="gap-1"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" /> Nie ({noCount})
                        </Button>
                        <Button
                          size="sm"
                          variant={myResponse?.response === "maybe" ? "secondary" : "outline"}
                          onClick={() => handleRespond(a.id, "maybe")}
                          className="gap-1"
                        >
                          <HelpCircle className="h-3.5 w-3.5" /> Może ({maybeCount})
                        </Button>
                      </div>

                      {a.responses.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        >
                          {isExpanded ? "Ukryj odpowiedzi" : `Pokaż odpowiedzi (${a.responses.length})`}
                        </Button>
                      )}

                      {isExpanded && (
                        <div className="space-y-1 text-sm">
                          {a.responses.map((r) => (
                            <div key={r.id} className="flex items-center gap-2">
                              <span className={
                                r.response === "yes" ? "text-green-600" :
                                r.response === "no" ? "text-red-600" : "text-yellow-600"
                              }>
                                {r.response === "yes" ? "\u2713" : r.response === "no" ? "\u2717" : "?"}
                              </span>
                              <span>{r.user.name}</span>
                              {r.comment && (
                                <span className="text-muted-foreground">— {r.comment}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateAnnouncementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        groups={groups}
        onSaved={fetchData}
      />
    </div>
  );
}

function CreateAnnouncementDialog({
  open, onClose, groups, onSaved,
}: {
  open: boolean; onClose: () => void; groups: Group[]; onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "INFO",
    groupId: "",
    pinned: false,
  });

  useEffect(() => {
    if (open) setForm({ title: "", content: "", type: "INFO", groupId: "", pinned: false });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        groupId: form.groupId || null,
      }),
    });

    if (res.ok) {
      toast.success("Ogłoszenie opublikowane");
      onSaved();
      onClose();
    } else {
      toast.error("Błąd zapisu");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nowe ogłoszenie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Tytuł</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="np. Zmiana godziny treningu"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Treść</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Treść ogłoszenia..."
              rows={4}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Typ</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Grupa</Label>
              <Select value={form.groupId} onValueChange={(v) => v && setForm({ ...form, groupId: v === "ALL" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Wszyscy" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Wszyscy</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              className="h-4 w-4 accent-blue-600"
            />
            Przypnij na górze
          </label>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-1" />
              {loading ? "Publikowanie..." : "Opublikuj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
