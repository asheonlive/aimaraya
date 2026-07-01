import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
export const API_BASE = `${BACKEND}/api`;

export const api = axios.create({ baseURL: API_BASE });

/** Resolve a media path returned by the backend.
 * Accepts absolute URLs (passthrough) or relative paths like "/api/media/x.png". */
export const resolveMedia = (path) => {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND}${path}`;
};

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("maraya_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
