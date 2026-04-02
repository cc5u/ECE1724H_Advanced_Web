import { useState } from "react"
import axios from "axios"
import { signupUser } from "../auth/authService"
import { Lock, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SignupFormProps {
  onSuccess?: () => void
}

const SignupForm = ({ onSuccess }: SignupFormProps) => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      await signupUser(username, email, password)
      onSuccess?.()
      alert("Account created! Please login.")
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : error instanceof Error
          ? error.message
          : "Signup failed"

      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
        Username
      </label>
      <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            id="username"
            className="h-12 pl-10 pr-4"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="name"
            required
          />
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
      <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            id="email"
            className="h-12 pl-10 pr-4"
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
          <Input
            id="password"
            className="h-12 pl-10 pr-4"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
      </div>

      <Button type="submit"
        disabled={isSubmitting}
        className="h-12 w-full"
      >{isSubmitting ? "Creating Account..." : "Create Account"}</Button>
    </form>
  )
}

export default SignupForm
