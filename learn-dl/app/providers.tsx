"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/src/auth/AuthContext";
import { TrainingRuntimeProvider } from "@/src/training/TrainingRuntimeContext";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <TrainingRuntimeProvider>{children}</TrainingRuntimeProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
