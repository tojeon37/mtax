import axios from "axios";
import { getToken } from "./authApi";
import { refreshAccessToken } from "./tokenRefresh";

// API 기본 URL 설정
// 환경변수 VITE_API_BASE_URL이 설정되어 있으면 사용하고, 없으면 localhost 기본값 사용
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Refresh token 갱신 중인지 추적 (무한 루프 방지)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 요청 인터셉터 - 토큰 자동 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 처리 및 자동 refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 refresh 중이면 대기열에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // 새 토큰으로 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;
          return axiosInstance(originalRequest);
        } else {
          // Refresh 실패 시 대기열의 모든 요청 거부
          processQueue(new Error("Refresh token 갱신 실패"), null);
          isRefreshing = false;
          
          // 로그인 페이지로 리다이렉트
          const isLoginPage = window.location.pathname === "/login";
          const isRegisterPage = window.location.pathname === "/register";
          if (!isLoginPage && !isRegisterPage) {
            window.location.href = "/login";
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // 로그인 페이지로 리다이렉트
        const isLoginPage = window.location.pathname === "/login";
        const isRegisterPage = window.location.pathname === "/register";
        if (!isLoginPage && !isRegisterPage) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

