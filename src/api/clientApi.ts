import axios from "./axiosInstance";

export interface Client {
  id: number;
  businessNumber: string;
  companyName: string;
  ceoName: string;
  businessType: string;
  businessItem: string;
  address: string;  // 주소 (주소 + 상세주소 통합)
  addressDetail?: string;  // 더 이상 사용하지 않음 (하위 호환성을 위해 Optional로 유지)
  email: string;
  tel?: string;  // 전화번호
  hp?: string;  // 휴대폰번호
  memo?: string;
}

// 백엔드 snake_case를 프론트엔드 camelCase로 변환
const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      newObj[camelKey] = toCamelCase(obj[key]);
    }
    return newObj;
  }
  return obj;
};

// 프론트엔드 camelCase를 백엔드 snake_case로 변환
const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      // camelCase를 snake_case로 변환
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      newObj[snakeKey] = toSnakeCase(obj[key]);
    }
    return newObj;
  }
  return obj;
};

export const getClients = async () => {
  try {
    const res = await axios.get("/clients");
    console.log("거래처 목록 응답:", res.data);
    const converted = toCamelCase(res.data);
    console.log("변환된 거래처 목록:", converted);
    return converted;
  } catch (error: any) {
    console.error("거래처 목록 조회 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const createClient = async (data: any) => {
  try {
    const snakeData = toSnakeCase(data);
    console.log("전송할 데이터 (snake_case):", snakeData);
    const res = await axios.post("/clients", snakeData);
    console.log("거래처 생성 응답:", res.data);
    return toCamelCase(res.data);
  } catch (error: any) {
    console.error("거래처 생성 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const updateClient = async (id: number, data: any) => {
  const res = await axios.put(`/clients/${id}`, toSnakeCase(data));
  return toCamelCase(res.data);
};

export const deleteClient = async (id: number) => {
  const res = await axios.delete(`/clients/${id}`);
  return res.data;
};

