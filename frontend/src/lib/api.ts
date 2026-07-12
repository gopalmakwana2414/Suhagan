import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api",
  timeout: 15000, // 15s timeout to prevent hung requests under peak load
});

api.interceptors.request.use(
  (config) => {
    const authStorage =
      localStorage.getItem("auth-storage");

    if (authStorage) {
      const parsed =
        JSON.parse(authStorage);

      const token =
        parsed?.state?.token;

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  }
);

export default api;