"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteThemeProvider } from "@/contexts/SiteThemeContext";
import { DemoFeedbackFab, DemoFeedbackProvider } from "@/components/DemoFeedback";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SiteThemeProvider>
      <AuthProvider>
        <DemoFeedbackProvider>
          <div className="flex min-h-0 flex-1 flex-col">
            {children}
            <DemoFeedbackFab />
          </div>
        </DemoFeedbackProvider>
      </AuthProvider>
    </SiteThemeProvider>
  );
}
