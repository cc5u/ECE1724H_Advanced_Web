import { useState } from "react"
import { signupUser } from "../auth/authService"
import { Lock, Mail, User } from "lucide-react"

interface SignupFormProps {
  onSuccess?: () => void
}

const SignupForm = ({ onSuccess }: SignupFormProps) => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    
    await signupUser(username, email, password)
    onSuccess?.()
    alert("Account created! Please login.")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
        Username
      </label>
      <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            id="username"
            className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
      </div>

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
            autoComplete="new-password"
            minLength={6}
            required
          />
      </div>

      <button type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >Create Account</button>
    </form>
  )
}

export default SignupForm
