import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
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

// =========================================================
// 공통 인터셉터 적용: API 요청 시 자동으로 식별아이디와 회사정보를 헤더에 포함
// =========================================================
const applyAuthInterceptor = (instance) => {
  instance.interceptors.request.use((config) => {
    const uuid = localStorage.getItem("uuid");
    const selectedCompanyRaw = localStorage.getItem("selectedCompany");
    const selectedCompany = selectedCompanyRaw ? JSON.parse(selectedCompanyRaw) : null;

    if (uuid) {
      // Authorization 헤더에 식별아이디(uuid) 추가
      config.headers['Authorization'] = `Bearer ${uuid}`;
    }
    if (selectedCompany?.company_id) {
      // 회사 ID를 백엔드가 요구하는 헤더 키로 추가 (예: X-Company-ID)
      config.headers['X-Company-ID'] = selectedCompany.company_id;
    }
    return config;
  });
};

applyAuthInterceptor(api);
applyAuthInterceptor(skmApi);
applyAuthInterceptor(hgApi);
applyAuthInterceptor(tvApi);
