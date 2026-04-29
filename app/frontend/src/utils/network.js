import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

export const skmApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL_SKM,
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

export const hgApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL_HG,
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

export const tvApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL_TV,
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})
