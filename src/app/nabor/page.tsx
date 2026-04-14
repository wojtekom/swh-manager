import type { Metadata } from "next";
import { Suspense } from "react";
import { RecruitmentForm } from "./recruitment-form";

export const metadata: Metadata = {
  title: "Nabór do sekcji hokejowej — SWH Siedlce",
  description:
    "Zapisz swoje dziecko do sekcji hokejowej Stowarzyszenia Wybieram Hokej w Siedlcach! Grupy wiekowe: U8, U10, U12, U14, U16, U18 oraz seniorzy.",
  openGraph: {
    title: "Nabór do sekcji hokejowej — SWH Siedlce",
    description:
      "Dołącz do nas! Zapraszamy dzieci i młodzież na treningi hokeja na lodzie. Stowarzyszenie Wybieram Hokej Siedlce prowadzi nabór do wszystkich grup wiekowych.",
    type: "website",
    locale: "pl_PL",
    siteName: "SWH Manager",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nabór do sekcji hokejowej — SWH Siedlce",
    description:
      "Dołącz do nas! Zapraszamy na treningi hokeja na lodzie w Siedlcach.",
  },
};

export default function RecruitmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Ladowanie formularza...</div>}>
      <RecruitmentForm />
    </Suspense>
  );
}
