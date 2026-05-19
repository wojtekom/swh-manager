"use client";
import { useEffect, useState } from "react";

type PendingUser = { id: string; email: string; name: string };

export default function AktywujRodzicowPage() {
  const [count, setCount] = useState<number | null>(null);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invitations/activate-imported");
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t.substring(0, 200)}`);
      }
      const data = await res.json();
      setCount(data.count);
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany blad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const sendActivations = async () => {
    if (!confirm(`Wyslac email aktywacyjny do ${count} rodzicow?`)) return;
    setSending(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/invitations/activate-imported", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setResult(
        `Wyslano: ${data.sent} z ${data.total}. Bledy: ${data.failed}.`
      );
      await loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany blad");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Aktywacja rodzicow z importu</h1>
      <p className="text-gray-600 mb-6">
        Rodzice zaimportowani z SportsManago nie mieli ustawionego hasla. Ten panel
        wysyla im emaile aktywacyjne — kliknij link w emailu, ustaw haslo, zaloguj sie.
      </p>

      {loading && <p>Sprawdzam liczbe kont do aktywacji...</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          <strong>Blad:</strong> {error}
        </div>
      )}

      {!loading && count !== null && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-sky-600">{count}</div>
              <div className="text-sm text-gray-500">kont czeka na aktywacje</div>
            </div>
            <button
              onClick={sendActivations}
              disabled={sending || count === 0}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold shadow-md hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sending
                ? "Wysylam..."
                : count === 0
                ? "Brak kont do aktywacji"
                : `Wyslij ${count} linkow aktywacyjnych`}
            </button>
          </div>

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 mb-4">
              <strong>Sukces:</strong> {result}
            </div>
          )}

          {users.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Pokaz liste ({users.length})
              </summary>
              <div className="mt-3 max-h-96 overflow-y-auto border border-gray-100 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2">Imie</th>
                      <th className="px-3 py-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">{u.name}</td>
                        <td className="px-3 py-2 text-gray-600">{u.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
