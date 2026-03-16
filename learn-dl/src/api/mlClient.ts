import axios from "axios";

const mlClient = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL || "https://steering-stones-viewers-ordered.trycloudflare.com/model_api",
  headers: {
    "Content-Type": "application/json"
  }
});

export default mlClient;