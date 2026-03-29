import type { ReactNode } from "react";
import ProtectedRoute from "@/src/auth/ProtectedRoute";
import { PageLayout } from "@/src/layouts/PageLayout";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <PageLayout>{children}</PageLayout>
    </ProtectedRoute>
  );
}
