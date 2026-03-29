"use client"

import { useAuth } from "./useAuth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

interface Props {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, isAuthLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && pathname !== "/") {
      router.replace("/")
    }
  }, [isAuthenticated, isAuthLoading, pathname, router])

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Checking session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}

export default ProtectedRoute
