import axios from "./axiosInstance";
import { formatError } from "../utils/errorHelpers";

export interface AutoLinkRequest {
  company_id: number;
  password?: string;  // 바로빌 비밀번호 (평문, 선택적)
}

export interface AutoLinkResponse {
  success: boolean;
  message: string;
  resultCode?: number;  // 바로빌 API 응답 코드 (0: 성공, -32000: 이미 가입된 사업자)
}

export const autoLinkBarobill = async (companyId: number, password?: string): Promise<AutoLinkResponse> => {
  try {
    // 세션 스토리지에서 비밀번호 가져오기 (없으면 파라미터 사용)
    const barobillPassword = password || sessionStorage.getItem('barobill_password')

    const requestBody: AutoLinkRequest = {
      company_id: companyId,
    }

    // 비밀번호가 있으면 추가
    if (barobillPassword) {
      requestBody.password = barobillPassword
    }

    const res = await axios.post<AutoLinkResponse>("/barobill/auto-link", requestBody);
    return res.data;
  } catch (error: any) {
    console.error("바로빌 연동 에러:", error.response?.data || error.message);
    throw error;
  }
};

export interface CorpStateCheckRequest {
  corp_num: string;
}

export interface CorpStateCheckResponse {
  success: boolean;
  data?: {
    state: number;
    state_description: string;
    corp_num: string;
    corp_name: string;
    ceo_name: string;
    corp_type: string;
    state_name: string;
    is_normal: boolean;
  };
  state_name?: string;
  state_description?: string;
  is_normal?: boolean;
  message?: string;
}

export interface CorpStateHistoryResponse {
  success: boolean;
  last_checked_at?: string;
  state_name?: string;
  state?: number;
  message?: string;
}

export const checkCorpState = async (corpNum: string): Promise<CorpStateCheckResponse> => {
  try {
    const res = await axios.post<CorpStateCheckResponse>("/corp-state/check", {
      corp_num: corpNum,
    });
    return res.data;
  } catch (error: any) {
    console.error("사업자 상태 조회 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const getCorpStateHistory = async (corpNum: string): Promise<CorpStateHistoryResponse> => {
  try {
    // 사업자번호에서 하이픈 제거
    const corpNumClean = corpNum.replace(/-/g, '')
    const res = await axios.get<CorpStateHistoryResponse>(`/corp-state/history/${encodeURIComponent(corpNumClean)}`);
    return res.data;
  } catch (error: any) {
    // 404 오류는 조회 이력이 없는 것으로 처리 (에러를 throw하지 않음)
    if (error.response?.status === 404) {
      return { success: false, message: "조회 이력이 없습니다." };
    }
    console.error("사업자 상태 조회 이력 에러:", error.response?.data || error.message);
    throw error;
  }
};

export interface CertificateStatusResponse {
  certificate_registered: boolean;
  certificate_status_message: string;
  can_issue_invoice: boolean;
}

export const fetchCertificateStatus = async (): Promise<CertificateStatusResponse> => {
  try {
    const res = await axios.get<CertificateStatusResponse>("/certificate/status");
    return res.data;
  } catch (error: any) {
    console.error("인증서 상태 조회 에러:", error.response?.data || error.message);
    // 에러 발생 시 인증서 미등록으로 간주
    return {
      certificate_registered: false,
      certificate_status_message: formatError(error) || "인증서 상태를 확인할 수 없습니다.",
      can_issue_invoice: false,
    };
  }
};

export interface CertificateCheckRequest {
  password?: string;
}

export interface CertificateCheckResponse {
  is_valid: boolean;
  message: string;
  regist_url?: string | null;
}

export const checkCertificate = async (password?: string): Promise<CertificateCheckResponse> => {
  try {
    // 세션 스토리지에서 비밀번호 가져오기 (없으면 파라미터 사용)
    const barobillPassword = password || sessionStorage.getItem('barobill_password');

    if (!barobillPassword) {
      return {
        is_valid: false,
        message: "인증서 확인을 위해 비밀번호가 필요합니다.",
        regist_url: null,
      };
    }

    const requestBody: CertificateCheckRequest = {
      password: barobillPassword,
    };

    const res = await axios.post<CertificateCheckResponse>("/barobill/certificate/check", requestBody);
    return res.data;
  } catch (error: any) {
    console.error("인증서 확인 에러:", error.response?.data || error.message);
    throw error;
  }
};

