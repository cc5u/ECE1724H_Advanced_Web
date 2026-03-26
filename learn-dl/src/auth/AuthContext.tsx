import { useEffect, useRef, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { AuthContext } from "./authContext"
import {
  getCurrentUser,
  isSignupInProgress,
  logoutUser,
  type AuthUser,
} from "./authService"
import { auth } from "./firebase"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const hydratedFirebaseUidRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!isMounted) {
          return
        }

        hydratedFirebaseUidRef.current = null
        setUser(null)
        setIsAuthenticated(false)
        setIsAuthLoading(false)
        return
      }

      try {
        if (isSignupInProgress()) {
          if (!isMounted) {
            return
          }

          setIsAuthLoading(false)
          setUser(null)
          setIsAuthenticated(false)
          return
        }

        if (hydratedFirebaseUidRef.current === firebaseUser.uid) {
          if (!isMounted) {
            return
          }

          setIsAuthLoading(false)
          setIsAuthenticated(true)
          return
        }

        if (isMounted) {
          setIsAuthLoading(true)
        }

        const currentUser = await getCurrentUser()

        if (!isMounted) {
          return
        }

        if (!currentUser) {
          hydratedFirebaseUidRef.current = null
          setUser(null)
          setIsAuthenticated(false)
          return
        }

        hydratedFirebaseUidRef.current = currentUser.firebaseUid
        setUser(currentUser)
        setIsAuthenticated(true)
      } catch {
        hydratedFirebaseUidRef.current = null
        await logoutUser()

        if (!isMounted) {
          return
        }

        setUser(null)
        setIsAuthenticated(false)
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const login = (nextUser: AuthUser) => {
    hydratedFirebaseUidRef.current = nextUser.firebaseUid
    setUser(nextUser)
    setIsAuthLoading(false)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    hydratedFirebaseUidRef.current = null
    await logoutUser()
    setUser(null)
    setIsAuthLoading(false)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isAuthLoading, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
