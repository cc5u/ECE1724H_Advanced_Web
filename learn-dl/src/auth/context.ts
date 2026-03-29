import { createContext } from "react"
import type { AuthUser } from "./authService"

export interface AuthContextType {
  isAuthenticated: boolean
  isAuthLoading: boolean
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
