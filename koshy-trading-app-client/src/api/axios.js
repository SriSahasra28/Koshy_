import axios from "axios";
import { EnvVariables } from "../utils/env.utils";

// axios.defaults.withCredentials = true;

const axiosInstance = axios.create({
  baseURL: EnvVariables.apiEndpoint,
});

axiosInstance.interceptors.request.use((config) => {
  const accessToken = "";

  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken || ""}`;
  }
  return config;
});

// axiosInstance.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access_token");
//   config.params = config.params || {};
//   config.params["auth"] = token;
//   return config;
// });

export default axiosInstance;
