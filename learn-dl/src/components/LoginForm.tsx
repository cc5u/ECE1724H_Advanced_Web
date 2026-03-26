import { useState } from "react"
import axios from "axios"
import { loginUser } from "../auth/authService"
import { useAuth } from "../auth/useAuth"
import { useNavigate } from "react-router"
import { Lock, Mail } from "lucide-react"

const LoginForm = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const data = await loginUser(email, password)
      login(data.user)
      navigate("/training")
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : error instanceof Error
          ? error.message
          : "Login failed"

      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            id="email"
            className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
      </div>

        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            id="password"
            className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            {isSubmitting ? "Logging in..." : "Login"}
        </button>
    </form>
  )
}

export default LoginForm
