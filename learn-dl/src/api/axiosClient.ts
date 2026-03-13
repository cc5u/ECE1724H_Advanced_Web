import axios from "axios"
import { getAuth } from "firebase/auth"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
})

api.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser

  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  } else if(config.headers.Authorization) {
    delete config.headers.Authorization
  }

  return config
})

export default api
