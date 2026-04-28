import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

export const skmApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL_SKM || "http://localhost:8000",
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})
export const hgApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL_HG || "http://localhost:8000",
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})
export const tvApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL_TV || "http://localhost:8000",
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})
