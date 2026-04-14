"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MessageCircle,
  Plus,
  Send,
  ArrowLeft,
  Users,
  User,
  Search,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  userId: string;
  lastReadAt: string;
  user: { id: string; name: string; role: string };
}

interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  groupId: string | null;
  group: { id: string; name: string; category: string } | null;
  participants: Participant[];
  messages: LastMessage[];
  lastReadAt: string;
  _count: { messages: number };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  COACH: "Trener",
  PARENT: "Rodzic",
  PLAYER: "Zawodnik",
};

export default function MessagesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isAdmin = session?.user?.role === "ADMIN";
  const isCoach = session?.user?.role === "COACH";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) setConversations(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      toast.error("Błąd pobierania wiadomości");
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
    if (authStatus === "authenticated") fetchConversations();
  }, [authStatus, router, fetchConversations]);

  // Polling co 5s dla aktywnej konwersacji
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeConv) {
      fetchMessages(activeConv);
      pollRef.current = setInterval(() => {
        fetchMessages(activeConv);
        fetchConversations();
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConv, fetchMessages, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${activeConv}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages(activeConv);
        fetchConversations();
      }
    } catch {
      toast.error("Nie udało się wysłać");
    } finally {
      setSending(false);
    }
  }

  function getConversationName(conv: Conversation) {
    if (conv.name) return conv.name;
    if (conv.group) return conv.group.name;
    const other = conv.participants.find((p) => p.userId !== userId);
    return other?.user.name || "Konwersacja";
  }

  function getConversationSubtitle(conv: Conversation) {
    if (conv.isGroup) {
      return `${conv.participants.length} uczestników`;
    }
    const other = conv.participants.find((p) => p.userId !== userId);
    return other ? ROLE_LABELS[other.user.role] || other.user.role : "";
  }

  const activeConversation = conversations.find((c) => c.id === activeConv);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {activeConv && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setActiveConv(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold">Wiadomości</h1>
        </div>
        <div className="flex gap-2">
          {(isAdmin || isCoach) && (
            <Button size="sm" variant="outline" onClick={() => setBroadcastOpen(true)}>
              <Megaphone className="h-4 w-4 mr-1" /> Masowa
            </Button>
          )}
          <Button size="sm" onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nowa
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista konwersacji */}
        <div
          className={cn(
            "w-full md:w-80 border-r flex flex-col overflow-hidden",
            activeConv ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">
                Ładowanie...
              </p>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Brak wyników" : "Brak konwersacji"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const lastMsg = conv.messages[0];
                const isActive = conv.id === activeConv;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b hover:bg-accent transition-colors",
                      isActive && "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          conv.isGroup
                            ? "bg-sky-100 text-sky-600"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {conv.isGroup ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {getConversationName(conv)}
                          </p>
                          {lastMsg && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(lastMsg.createdAt).toLocaleTimeString(
                                "pl-PL",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMsg
                            ? `${lastMsg.sender.name}: ${lastMsg.content}`
                            : getConversationSubtitle(conv)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Panel wiadomości */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            !activeConv ? "hidden md:flex" : "flex"
          )}
        >
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Wybierz konwersację lub rozpocznij nową
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Nagłówek konwersacji */}
              <div className="px-4 py-3 border-b bg-card flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center",
                    activeConversation?.isGroup
                      ? "bg-sky-100 text-sky-600"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {activeConversation?.isGroup ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {activeConversation
                      ? getConversationName(activeConversation)
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeConversation
                      ? getConversationSubtitle(activeConversation)
                      : ""}
                  </p>
                </div>
              </div>

              {/* Wiadomości */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading && messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Ładowanie...
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Brak wiadomości. Napisz pierwszą!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender.id === userId;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isMine ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2",
                            isMine
                              ? "bg-sky-500 text-white rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          {!isMine && activeConversation?.isGroup && (
                            <p className="text-xs font-medium mb-0.5 opacity-70">
                              {msg.sender.name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <p
                            className={cn(
                              "text-[10px] mt-1",
                              isMine
                                ? "text-sky-200"
                                : "text-muted-foreground"
                            )}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "pl-PL",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t bg-card flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Napisz wiadomość..."
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <NewConversationDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onCreated={(convId) => {
          setNewDialogOpen(false);
          fetchConversations();
          setActiveConv(convId);
        }}
        currentUserId={userId || ""}
      />

      {broadcastOpen && (
        <BroadcastDialog
          onClose={() => setBroadcastOpen(false)}
          onSent={(convId) => {
            setBroadcastOpen(false);
            fetchConversations();
            setActiveConv(convId);
          }}
        />
      )}
    </div>
  );
}

function NewConversationDialog({
  open,
  onClose,
  onCreated,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (convId: string) => void;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setGroupName("");
    setSearch("");
    fetch("/api/conversations/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.filter((u: UserItem) => u.id !== currentUserId)))
      .catch(() => {});
  }, [open, currentUserId]);

  const isGroup = selected.length > 1;

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (ROLE_LABELS[u.role] || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (selected.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: isGroup ? groupName || null : null,
          isGroup,
          participantIds: selected,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data.id);
      } else {
        toast.error("Błąd tworzenia konwersacji");
      }
    } catch {
      toast.error("Błąd sieci");
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nowa konwersacja</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isGroup && (
            <div className="space-y-1">
              <Label>Nazwa grupy (opcjonalnie)</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="np. Rodzice U12"
              />
            </div>
          )}

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((id) => {
                const u = users.find((x) => x.id === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleUser(id)}
                  >
                    {u?.name} &times;
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj użytkownika..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-1">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak użytkowników
              </p>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-accent transition-colors text-sm",
                    selected.includes(u.id) && "bg-sky-50 dark:bg-sky-950"
                  )}
                >
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {ROLE_LABELS[u.role] || u.role}
                  </Badge>
                </button>
              ))
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button
              onClick={handleCreate}
              disabled={selected.length === 0 || loading}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {loading
                ? "Tworzenie..."
                : isGroup
                ? "Utwórz grupę"
                : "Rozpocznij czat"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TrainingGroup {
  id: string;
  name: string;
  category: string;
}

function BroadcastDialog({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: (convId: string) => void;
}) {
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"ALL" | "GROUP">("ALL");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [sendSms, setSendSms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then(setGroups)
      .catch(() => {});
  }, []);

  async function handleSend() {
    if (!content.trim()) { toast.error("Wpisz treść wiadomości"); return; }
    if (target === "GROUP" && !groupId) { toast.error("Wybierz grupę"); return; }
    setLoading(true);

    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          target,
          groupId: target === "GROUP" ? groupId : undefined,
          channels: { inApp: true, sms: sendSms },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Wysłano do ${data.recipientCount} osób`);
        onSent(data.conversationId);
      } else {
        const err = await res.json();
        toast.error(err.error || "Błąd wysyłania");
      }
    } catch {
      toast.error("Błąd sieci");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Wiadomość masowa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Odbiorcy</Label>
            <Select value={target} onValueChange={(v) => { if (v) setTarget(v as "ALL" | "GROUP"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Wszyscy aktywni użytkownicy</SelectItem>
                <SelectItem value="GROUP">Wybrana grupa treningowa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target === "GROUP" && (
            <div className="space-y-1">
              <Label>Grupa treningowa</Label>
              <Select value={groupId} onValueChange={(v) => { if (v) setGroupId(v); }}>
                <SelectTrigger><SelectValue placeholder="Wybierz grupę..." /></SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Treść wiadomości</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Wpisz treść wiadomości..."
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{content.length}/2000</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Wyślij również SMS (do osób z numerem telefonu)</span>
          </label>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>Anuluj</Button>
            <Button onClick={handleSend} disabled={loading || !content.trim()}>
              <Megaphone className="h-4 w-4 mr-1" />
              {loading ? "Wysyłanie..." : "Wyślij wiadomość"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
