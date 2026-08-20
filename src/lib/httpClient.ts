import axios from "axios";
import { auth } from "./firebase";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

httpClient.interceptors.request.use(async (config) => {
  // 새로고침 직후에는 auth.currentUser가 비동기로 복원되는 중이라 authStateReady()로 대기 후 읽는다.
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
