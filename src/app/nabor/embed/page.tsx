import type { Metadata } from "next";
import { Suspense } from "react";
import { RecruitmentForm } from "../recruitment-form";

export const metadata: Metadata = {
  title: "Nabor — SWH Siedlce",
};

// Wersja do osadzenia w iframe - bez dodatkowego layoutu
export default function EmbedRecruitmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Ladowanie formularza...</div>}>
      <RecruitmentForm />
    </Suspense>
  );
}
