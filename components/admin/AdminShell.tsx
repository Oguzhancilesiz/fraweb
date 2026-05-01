"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminArea } from "@/lib/auth/paths";
import { routes } from "@/lib/site";
import { LoadingState } from "@/components/dashboard/DashboardUI";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, user, token } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent("/admin")}`);
      return;
    }
    if (!canAccessAdminArea(user.roles)) router.replace(routes.home);
  }, [ready, token, user, router]);

  if (!ready) return <LoadingState label="Oturum kontrol ediliyor..." />;
  if (!token || !user || !canAccessAdminArea(user.roles)) return <LoadingState label="Yönlendiriliyorsunuz..." />;

  return <>{children}</>;
}
