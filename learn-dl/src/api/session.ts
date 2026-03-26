import api from "./axiosClient";

type AuthMeResponse = {
  user: {
    userId: string;
  };
};

export const getCurrentUserId = async () => {
  const response = await api.get<AuthMeResponse>("/auth/me");
  return String(response.data.user.userId);
};
