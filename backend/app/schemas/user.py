from pydantic import BaseModel, computed_field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """사용자 기본 스키마"""

    barobill_id: str
    biz_name: str
    email: Optional[str] = None  # 이메일 (선택)


class UserCreate(BaseModel):
    """사용자 생성 스키마"""

    barobill_id: str  # 바로빌 아이디
    password: str  # 바로빌 비밀번호
    email: Optional[str] = None  # 이메일 (선택)
    biz_name: Optional[str] = None  # 회사명 (선택)
    # 바로빌 회원가입에 필요한 추가 정보 (회원가입 시에는 선택적)
    business_no: Optional[str] = None  # 사업자등록번호
    company_name: Optional[str] = None  # 상호
    ceo_name: Optional[str] = None  # 대표자명
    address: Optional[str] = None  # 사업장 주소
    biz_type: Optional[str] = None  # 업태
    biz_item: Optional[str] = None  # 종목
    tel: Optional[str] = None  # 전화번호
    manager_name: Optional[str] = None  # 담당자 이름
    manager_tel: Optional[str] = None  # 담당자 휴대폰


class UserUpdate(BaseModel):
    """사용자 업데이트 스키마"""

    email: Optional[str] = None  # 이메일 (선택)
    biz_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """사용자 응답 스키마"""

    id: int
    barobill_id: str
    email: Optional[str] = None
    biz_name: str
    is_active: bool
    barobill_corp_num: Optional[str] = None
    barobill_cert_key: Optional[str] = None
    barobill_linked: Optional[bool] = False
    barobill_linked_at: Optional[datetime] = None
    free_invoice_remaining: int = 5
    has_payment_method: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    @computed_field
    @property
    def is_free_mode(self) -> bool:
        """무료 모드 여부 계산"""
        # 전자세금계산서 무료 제공 기간 기준으로 판단
        # 사업자상태조회는 전자세금계산서 무료 제공 기간 동안만 무료로 제공
        return self.free_invoice_remaining > 0

    class Config:
        from_attributes = True


class Token(BaseModel):
    """토큰 응답 스키마"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh 토큰 요청 스키마"""

    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Refresh 토큰 응답 스키마"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """토큰 데이터 스키마"""

    email: Optional[str] = None


class PasswordResetRequest(BaseModel):
    """비밀번호 재설정 요청 스키마"""

    barobill_id: str
    email: str


class PasswordReset(BaseModel):
    """비밀번호 재설정 스키마 (아이디/이메일 방식)"""

    barobill_id: str
    email: str
    new_password: str


class PasswordResetByToken(BaseModel):
    """비밀번호 재설정 스키마 (토큰 방식)"""

    token: str
    new_password: str


class PasswordChange(BaseModel):
    """비밀번호 변경 스키마 (로그인한 사용자가 자신의 비밀번호 변경)"""

    current_password: str
    new_password: str
