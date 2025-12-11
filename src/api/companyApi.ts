import axios from "./axiosInstance";

export interface Company {
  id: number;
  businessNumber: string;
  name: string;
  ceoName: string;
  bizType: string;
  bizClass: string;
  address: string;
  addressDetail: string;
  email: string;
  tel?: string;
  hp?: string;
  memo?: string;
}

export interface CompanyCreate {
  businessNumber: string;
  name: string;
  ceoName: string;
  bizType: string;
  bizClass: string;
  address: string;
  addressDetail: string;
  email: string;
  tel?: string;
  hp?: string;
  memo?: string;
}

export interface CompanyUpdate {
  businessNumber?: string;
  name?: string;
  ceoName?: string;
  bizType?: string;
  bizClass?: string;
  address?: string;
  addressDetail?: string;
  email?: string;
  tel?: string;
  hp?: string;
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
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      newObj[snakeKey] = toSnakeCase(obj[key]);
    }
    return newObj;
  }
  return obj;
};

export const getCompanies = async (): Promise<Company[]> => {
  try {
    const res = await axios.get("/companies");
    return toCamelCase(res.data);
  } catch (error: any) {
    console.error("회사 목록 조회 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const createCompany = async (data: CompanyCreate): Promise<Company> => {
  try {
    const snakeData = toSnakeCase(data);
    const res = await axios.post("/companies", snakeData);
    return toCamelCase(res.data);
  } catch (error: any) {
    console.error("회사 생성 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const updateCompany = async (id: number, data: CompanyUpdate): Promise<Company> => {
  try {
    const snakeData = toSnakeCase(data);
    const res = await axios.put(`/companies/${id}`, snakeData);
    return toCamelCase(res.data);
  } catch (error: any) {
    console.error("회사 수정 에러:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteCompany = async (id: number): Promise<void> => {
  try {
    await axios.delete(`/companies/${id}`);
  } catch (error: any) {
    console.error("회사 삭제 에러:", error.response?.data || error.message);
    throw error;
  }
};

