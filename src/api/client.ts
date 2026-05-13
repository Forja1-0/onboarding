import axios from "axios";

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

export const api = axios.create({
  baseURL: env.VITE_API_URL ?? "http://localhost:3000",
  timeout: 15000,
});
