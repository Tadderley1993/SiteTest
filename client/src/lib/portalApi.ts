import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export function createPortalApi(token: string) {
  return axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${token}` },
  })
}
