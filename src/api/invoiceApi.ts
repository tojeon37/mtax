import axios from "./axiosInstance";

export interface InvoiceCreate {
  customer_name: string;
  amount: number;
  tax_type: string;
  memo?: string;
}

export interface InvoiceResponse {
  id: number;
  user_id: number;
  customer_name: string;
  amount: number;
  tax_type: string;
  memo?: string;
  status: string;
  mgt_key?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * 세금계산서 발행
 */
export const createInvoice = async (data: InvoiceCreate): Promise<InvoiceResponse> => {
  const res = await axios.post<InvoiceResponse>("/invoices", data);
  return res.data;
};

/**
 * 발행 내역 조회
 */
export const getInvoiceHistory = async (): Promise<InvoiceResponse[]> => {
  const res = await axios.get<InvoiceResponse[]>("/invoices");
  return res.data;
};

/**
 * 세금계산서 취소 (바로빌로 발행한 것만 가능)
 */
export const cancelTaxInvoice = async (mgtKey: string): Promise<{ success: boolean, message: string }> => {
  const res = await axios.delete<{ success: boolean, result_code: number, message: string }>(`/tax-invoices/${mgtKey}`);
  return {
    success: res.data.success,
    message: res.data.message
  };
};

/**
 * 세금계산서 취소 (invoice_id로 취소)
 */
export const cancelTaxInvoiceByInvoiceId = async (invoiceId: number): Promise<{ success: boolean, message: string }> => {
  const res = await axios.delete<{ success: boolean, result_code: number, message: string }>(`/tax-invoices/by-invoice/${invoiceId}`);
  return {
    success: res.data.success,
    message: res.data.message
  };
};

/**
 * 세금계산서 상태 체크 및 업데이트 (바로빌 API 호출)
 */
export const checkInvoiceStatus = async (): Promise<{ success: boolean, message: string, updated_count: number, checked_count: number }> => {
  const res = await axios.post<{ success: boolean, message: string, updated_count: number, checked_count: number }>("/invoices/check-status");
  return res.data;
};

/**
 * 세금계산서 삭제 (바로빌로 발행하지 않은 것만 삭제 가능)
 */
export const deleteInvoice = async (invoiceId: number): Promise<{ success: boolean, message: string }> => {
  const res = await axios.delete<{ success: boolean, message: string }>(`/invoices/${invoiceId}`);
  return {
    success: res.data.success,
    message: res.data.message
  };
};
