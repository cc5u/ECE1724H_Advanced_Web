import { ArchiveIcon, Brain, BrainCog, Target } from "lucide-react";
import { NavLink, Outlet } from "react-router";

export function PageLayout() {
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
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                    }
                >
                    <BrainCog className="size-4" />
                    Training
                </NavLink>
                <NavLink
                    to="/prediction"
                    className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                    }
                >
                    <Target className="size-4" />
                    Prediction
                </NavLink>
                <NavLink
                    to="/archive"
                    className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                    }
                >
                    <ArchiveIcon className="size-4" />
                    Archive
                </NavLink>
                </div>
            </div>
            </div>
        </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      </div>
    );
}