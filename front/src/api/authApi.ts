import axios from 'axios'
import axiosInstance from './axiosInstance'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export interface LoginRequest {
  username: string // 바로빌 아이디
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user?: {
    id: number
    barobill_id: string
    email?: string
    biz_name: string
    free_invoice_remaining?: number
    has_payment_method?: boolean
  }
}

export interface UserInfo {
  id: number
  barobill_id: string
  email?: string
  biz_name: string
  free_invoice_remaining: number
  has_payment_method: boolean
  is_free_mode: boolean
}

/**
 * 사용자 정보 조회 API
 */
export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await axiosInstance.get<UserInfo>('/auth/me')
  return response.data
}

export interface CheckUsernameResponse {
  available: boolean
  message: string
}

export interface RegisterRequest {
  username: string // 바로빌 아이디
  password: string
  // 사업자 정보는 선택적 (회원가입 시에는 불필요)
  business_no?: string // 사업자등록번호
  company_name?: string // 상호
  ceo_name?: string // 대표자명
  address?: string // 사업장 주소
  biz_type?: string // 업태
  biz_item?: string // 종목
  email?: string
  tel?: string // 전화번호
  manager_name?: string // 담당자 이름
  manager_tel?: string // 담당자 휴대폰
}

/**
 * 로그인 API
 * OAuth2PasswordRequestForm 형식으로 요청 (application/x-www-form-urlencoded)
 */
export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const params = new URLSearchParams()
  params.append('username', payload.username)
  params.append('password', payload.password)

  const response = await axios.post<LoginResponse>(
    `${API_BASE_URL}/auth/login`,
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  // 로그인 성공 시 사용자 정보 조회
  if (response.data.access_token) {
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      })
      return {
        ...response.data,
        user: userResponse.data,
      }
    } catch (error) {
      // 사용자 정보 조회 실패해도 토큰은 반환
      console.error('사용자 정보 조회 실패:', error)
    }
  }

  return response.data
}

/**
 * 아이디 중복 확인 API
 */
export const checkUsername = async (
  username: string
): Promise<CheckUsernameResponse> => {
  const response = await axios.get<CheckUsernameResponse>(
    `${API_BASE_URL}/auth/check-username/${username}`
  )
  return response.data
}

/**
 * 회원가입 API
 */
export const register = async (
  payload: RegisterRequest
): Promise<LoginResponse> => {
  const requestBody: any = {
    barobill_id: payload.username,
    password: payload.password,
  }
  
  // 사업자 정보가 있는 경우에만 추가
  if (payload.email) requestBody.email = payload.email
  if (payload.business_no) requestBody.business_no = payload.business_no
  if (payload.company_name) {
    requestBody.company_name = payload.company_name
    requestBody.biz_name = payload.company_name
  }
  if (payload.ceo_name) requestBody.ceo_name = payload.ceo_name
  if (payload.address) requestBody.address = payload.address
  if (payload.biz_type) requestBody.biz_type = payload.biz_type
  if (payload.biz_item) requestBody.biz_item = payload.biz_item
  if (payload.tel) requestBody.tel = payload.tel
  if (payload.manager_name) requestBody.manager_name = payload.manager_name
  if (payload.manager_tel) requestBody.manager_tel = payload.manager_tel

  console.log('회원가입 API 요청:', requestBody)
  const response = await axios.post<LoginResponse>(
    `${API_BASE_URL}/auth/register`,
    requestBody
  )
  console.log('회원가입 API 응답:', response.data)

  // 회원가입 성공 시 자동 로그인
  if (response.data.access_token) {
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      })
      return {
        ...response.data,
        user: userResponse.data,
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error)
      // 사용자 정보 조회 실패해도 토큰은 반환
      return response.data
    }
  }

  return response.data
}

/**
 * Access token 저장
 */
export const saveToken = (token: string): void => {
  localStorage.setItem('access_token', token)
}

/**
 * Refresh token 저장
 */
export const saveRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token)
}

/**
 * Access token 조회
 */
export const getToken = (): string | null => {
  return localStorage.getItem('access_token')
}

/**
 * Refresh token 조회
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token')
}

/**
 * 모든 토큰 삭제
 */
export const removeToken = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

/**
 * 비밀번호 변경 API
 */
export const changePassword = async (
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  const token = getToken()
  if (!token) {
    throw new Error('로그인이 필요합니다.')
  }

  const response = await axiosInstance.put<ChangePasswordResponse>(
    '/auth/password',
    {
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
    }
  )

  return response.data
}

