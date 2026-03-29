import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import axios from "axios"
import api from "../api/axiosClient"
import { auth } from "./firebase"

export interface AuthUser {
  userId: string
  name: string | null
  email: string
  firebaseUid: string
}

interface BackendAuthResponse {
  user: AuthUser
}

const SIGNUP_IN_PROGRESS_KEY = "auth.signupInProgress"

const getRequiredAuth = () => {
  if (!auth) {
    throw new Error("Firebase auth is only available in the browser.")
  }

  return auth
}

const setSignupInProgress = (isInProgress: boolean) => {
  if (typeof window === "undefined") {
    return
  }

  if (isInProgress) {
    window.sessionStorage.setItem(SIGNUP_IN_PROGRESS_KEY, "true")
    return
  }

  window.sessionStorage.removeItem(SIGNUP_IN_PROGRESS_KEY)
}

export const isSignupInProgress = () => {
  if (typeof window === "undefined") {
    return false
  }

  return window.sessionStorage.getItem(SIGNUP_IN_PROGRESS_KEY) === "true"
}

const getAuthorizationHeader = async (user: User, forceRefresh = false) => {
  const token = await user.getIdToken(forceRefresh)

  return {
    Authorization: `Bearer ${token}`,
  }
}

export const loginUser = async (email: string, password: string) => {
  await signInWithEmailAndPassword(getRequiredAuth(), email, password)
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authenticated user is missing from the backend.")
  }

  return { user }
}

export const signupUser = async (
  name: string,
  email: string,
  password: string
) => {
  setSignupInProgress(true)
  let createdUser: User | null = null
  let shouldSignOut = false
  const firebaseAuth = getRequiredAuth()

  try {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    createdUser = credential.user
    shouldSignOut = true

    if (name.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() })
    }

    const res = await api.post<{ message: string; user: AuthUser }>(
      "/auth/register",
      null,
      {
        headers: await getAuthorizationHeader(credential.user, true),
      }
    )

    return res.data
  } catch (error) {
    if (createdUser) {
      try {
        await deleteUser(createdUser)
        shouldSignOut = false
      } catch (deleteError) {
        console.error("Failed to delete Firebase user after signup failure", deleteError)
      }
    }

    throw error
  } finally {
    if (shouldSignOut) {
      await signOut(firebaseAuth)
    }

    setSignupInProgress(false)
  }
}

export const getCurrentUser = async () => {
  try {
    const res = await api.get<BackendAuthResponse>("/auth/me")

    return res.data.user
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }

    throw error
  }
}

export const logoutUser = async () => {
  await signOut(getRequiredAuth())
}
