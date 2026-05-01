"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteThemeProvider } from "@/contexts/SiteThemeContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SiteThemeProvider>
      <AuthProvider>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </AuthProvider>
    </SiteThemeProvider>
  );
}
