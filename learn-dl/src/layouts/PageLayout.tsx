import { ArchiveIcon, Brain, BrainCog, LogOut, Target } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

export function PageLayout() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
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
                <NavLink
                    to="/training"
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
      <main className="flex-1">
        <Outlet />
      </main>
      </div>
    );
}
