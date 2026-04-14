"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export function ConsentGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);

  const isConsentPage = pathname === "/dashboard/consents";
  const isParent = session?.user?.role === "PARENT";

  useEffect(() => {
    if (status !== "authenticated" || !isParent || isConsentPage) {
      setChecked(true);
      return;
    }

    fetch("/api/consents")
      .then((r) => r.json())
      .then((data) => {
        if (!data.allAccepted) {
          setNeedsConsent(true);
          router.replace("/dashboard/consents");
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [status, isParent, isConsentPage, router]);

  if (!checked && isParent && !isConsentPage) {
    return null; // don't render until we know
  }

  if (needsConsent && !isConsentPage) {
    return null; // redirecting
  }

  return <>{children}</>;
}
