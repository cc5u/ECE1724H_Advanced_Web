import api from "../api/axiosClient"


export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/auth/login", {
    email,
    password,
  })

  localStorage.setItem("accessToken", res.data.accessToken)

  return res.data
}

export const signupUser = async (
  username: string,
  email: string,
  password: string
) => {
  const res = await api.post("/auth/register", {
    username,
    email,
    password,
  })

  return res.data
}

export const logoutUser = () => {
  localStorage.removeItem("accessToken")
}