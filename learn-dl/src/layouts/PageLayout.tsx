"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArchiveIcon, Brain, BrainCog, LogOut, Target } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useTrainingRuntime } from "../training/useTrainingRuntime";
import { formatTrainingStatus, isTerminalTrainingStatus } from "../training/runtime";

type PageLayoutProps = {
    children: ReactNode;
};

const navItems = [
    { href: "/training", label: "Training", icon: BrainCog },
    { href: "/prediction", label: "Prediction", icon: Target },
    { href: "/archive", label: "Archive", icon: ArchiveIcon },
];

export function PageLayout({ children }: PageLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user } = useAuth();
    const { currentJob } = useTrainingRuntime();
    const shouldShowTrainingBanner =
        !!currentJob && !isTerminalTrainingStatus(currentJob.status);

    const handleLogout = async () => {
        await logout();
        router.replace("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
            <div className="flex h-16 items-center gap-8">
                <div className="flex items-center gap-2">
                <Brain className="size-8 text-blue-600" />
                <span className="font-semibold text-xl">Learn DL</span>
                </div>
                <div className="flex gap-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            <Icon className="size-4" />
                            {label}
                        </Link>
                    );
                })}
                </div>
                <div className="ml-auto flex items-center gap-3">
                {user ? (
                    <span className="text-sm text-gray-500">{user.name}</span>
                ) : null}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                    <LogOut className="size-4" />
                    Logout
                </button>
                </div>
            </div>
            </div>
        </nav>
      {shouldShowTrainingBanner ? (
        <div className="border-b border-blue-200 bg-blue-50">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 text-sm text-blue-900">
            <div className="min-w-0">
              <span className="font-medium">{currentJob.modelName}</span>
              <span className="ml-2 text-blue-800">
                {formatTrainingStatus(currentJob.status)} ({currentJob.progress}%)
              </span>
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full bg-blue-600 transition-[width] duration-300 ease-in-out"
                style={{ width: `${currentJob.progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <main className="flex-1">
        {children}
      </main>
      </div>
    );
}
