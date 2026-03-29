"use client";

import type { ReactNode } from "react";
import { Theme } from "@radix-ui/themes";
import { AuthProvider } from "@/src/auth/AuthContext";
import { TrainingRuntimeProvider } from "@/src/training/TrainingRuntimeContext";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <Theme>
      <AuthProvider>
        <TrainingRuntimeProvider>{children}</TrainingRuntimeProvider>
      </AuthProvider>
    </Theme>
  );
}
