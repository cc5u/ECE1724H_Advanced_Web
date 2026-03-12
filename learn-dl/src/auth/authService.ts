import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import api from "../api/axiosClient"
import { auth } from "./firebase"

export interface AuthUser {
  id: string
  name: string | null
  email: string
  firebaseUid: string
}

interface BackendAuthResponse {
  user: AuthUser
}

export const loginUser = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password)
  const res = await api.post<BackendAuthResponse>("/auth/login")

  return res.data
}

export const signupUser = async (
  name: string,
  email: string,
  password: string
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)

  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() })
  }

  await credential.user.getIdToken(true)

  const res = await api.post<{ message: string; user: AuthUser }>("/auth/register")

  return res.data
}

export const getCurrentUser = async () => {
  const res = await api.post<BackendAuthResponse>("/auth/login")
  return res.data.user
}

export const logoutUser = async () => {
  await signOut(auth)
}

export const waitForAuthUser = () =>
  new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
