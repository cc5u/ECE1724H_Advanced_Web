"use client";

import { useAuth } from "../auth/useAuth"
import LoginForm from "../components/LoginForm"
import { Brain } from "lucide-react"
import SignupForm from "../components/SignupForm"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"


const WelcomePage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isAuthLoading } = useAuth()
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/training");
    }
  }, [isAuthenticated, router]);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 text-sm text-gray-500">
        Checking session...
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="size-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ML Training Platform</h1>
          <p className="text-gray-600">Train, predict, and manage your machine learning models</p>
        </div>

        <Card className="w-full border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-600 mb-6">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Sign up to start training your models"}
            </p>
            {isLogin ? <LoginForm /> : <SignupForm onSuccess={() => setIsLogin(true)} />}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Build and deploy machine learning models with ease
        </p>
      </div>
    </div>
  )
}

export default WelcomePage
