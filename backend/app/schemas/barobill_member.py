from pydantic import BaseModel
from typing import Optional


class BarobillMemberCreate(BaseModel):
    """바로빌 회원사 가입 스키마"""
    # 사업자 정보
    corp_num: str  # 사업자번호 (하이픈 없이)
    corp_name: str  # 상호명
    ceo_name: str  # 대표자명
    biz_type: Optional[str] = None  # 업태
    biz_class: Optional[str] = None  # 종목
    post_num: Optional[str] = None  # 우편번호
    addr1: str  # 주소1
    addr2: Optional[str] = None  # 주소2
    
    # 회원 정보
    member_name: str  # 담당자명
    id: str  # 바로빌 아이디
    pwd: str  # 바로빌 비밀번호
    grade: Optional[str] = None  # 등급
    tel: Optional[str] = None  # 전화번호
    hp: Optional[str] = None  # 휴대폰번호
    email: str  # 이메일 (필수)  # 이메일


class BarobillMemberResponse(BaseModel):
    """바로빌 회원사 가입 응답 스키마"""
    success: bool
    cert_key: Optional[str] = None  # 발급받은 인증키
    message: str

