import { Sidebar } from "@/components/sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { ConsentGuard } from "@/components/consent-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with notification bell */}
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-slate-200/60 bg-white/60 px-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60 md:px-6">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/80 via-sky-50/30 to-blue-50/40 p-4 md:p-8">
          <ConsentGuard>{children}</ConsentGuard>
        </main>
      </div>
    </div>
  );
}
