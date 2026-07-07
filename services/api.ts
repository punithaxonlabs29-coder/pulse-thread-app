import axios from "axios";
import { CONFIG } from "../constants/config";
import { SessionService } from "./session.service";

const authApi = axios.create({
  baseURL: CONFIG.AUTH_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

authApi.interceptors.request.use(async (config) => {
  const token = await SessionService.getToken();

  if (token) {
    config.headers.Cookie = `sessionid=${token}`;
  }

  console.log("--------------------------------");
  console.log(config.method?.toUpperCase());
  console.log(`${config.baseURL}${config.url}`);
  console.log("--------------------------------");

  return config;
});

export default authApi;