import { Navigate } from "react-router"
import { useAuth } from "./AuthContext"

interface Props {
  children: React.ReactElement
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute