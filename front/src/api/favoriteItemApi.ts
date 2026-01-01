import axios from "./axiosInstance";

// 백엔드 snake_case 응답
interface FavoriteItemResponse {
  id: number;
  user_id: number;
  name: string;
  specification?: string;
  unit_price: number;
  created_at: string;
  updated_at?: string;
}

// 프론트엔드 camelCase
export interface FavoriteItem {
  id: number;
  userId: number;
  name: string;
  specification?: string;
  unitPrice: number;
  createdAt: string;
  updatedAt?: string;
}

// snake_case를 camelCase로 변환
const toCamelCase = (obj: FavoriteItemResponse): FavoriteItem => ({
  id: obj.id,
  userId: obj.user_id,
  name: obj.name,
  specification: obj.specification,
  unitPrice: Number(obj.unit_price),
  createdAt: obj.created_at,
  updatedAt: obj.updated_at,
});

export interface FavoriteItemCreate {
  name: string;
  specification?: string;
  unit_price: number; // 백엔드로 전송 시 snake_case
}

export interface FavoriteItemUpdate {
  name?: string;
  specification?: string;
  unit_price?: number;
}

/**
 * 자주 사용하는 품목 조회
 */
export const getFavoriteItems = async (): Promise<FavoriteItem[]> => {
  const res = await axios.get<FavoriteItemResponse[]>("/favorite-items");
  return res.data.map(toCamelCase);
};

/**
 * 자주 사용하는 품목 추가
 */
export const createFavoriteItem = async (
  data: FavoriteItemCreate
): Promise<FavoriteItem> => {
  const res = await axios.post<FavoriteItemResponse>("/favorite-items", data);
  return toCamelCase(res.data);
};

/**
 * 자주 사용하는 품목 수정
 */
export const updateFavoriteItem = async (
  id: number,
  data: FavoriteItemUpdate
): Promise<FavoriteItem> => {
  const res = await axios.put<FavoriteItemResponse>(`/favorite-items/${id}`, data);
  return toCamelCase(res.data);
};

/**
 * 자주 사용하는 품목 삭제 (soft delete)
 */
export const deleteFavoriteItem = async (id: number): Promise<void> => {
  await axios.delete(`/favorite-items/${id}`);
};

/**
 * 로컬 스토리지에서 서버로 마이그레이션
 */
export const migrateFavoriteItems = async (
  items: FavoriteItemCreate[]
): Promise<FavoriteItem[]> => {
  const res = await axios.post<FavoriteItemResponse[]>("/favorite-items/migrate", items);
  return res.data.map(toCamelCase);
};

