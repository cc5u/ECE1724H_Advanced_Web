import axios from "axios";

const mlClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ML_API_URL?.trim() || "/model_api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default mlClient;
