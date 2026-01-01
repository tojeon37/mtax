from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Optional
import logging
import os

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # =========================
    # Database (Cloud Run 기준)
    # =========================
    DATABASE_URL: str  # Cloud Run 환경변수에서 반드시 주입

    # =========================
    # App Environment
    # =========================
    ENV: str = "production"
    API_V1_PREFIX: str = "/api/v1"

    # =========================
    # JWT & Security
    # =========================
    SECRET_KEY: Optional[str] = (
        None  # JWT 시크릿 키 (환경변수에서 주입 필수, .env 또는 Cloud Run 환경변수)
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # =========================
    # 바로빌 파트너 설정 (필수 - 회원가입 시 바로빌 연동에 필요)
    # 파트너 인증키를 사용하여 하위 회원사를 바로빌에 등록/관리
    #
    # 보안 주의: 인증키는 환경변수(.env 또는 Cloud Run 환경변수)로만 관리
    # 코드에 하드코딩하지 않음 (깃허브 노출 방지)
    # =========================
    BAROBILL_CERT_KEY: Optional[str] = (
        None  # 파트너 인증키 (환경변수에서 읽어옴, .env 또는 Cloud Run 환경변수)
    )
    BAROBILL_CORP_NUM: Optional[str] = (
        None  # 파트너 사업자번호 (하이픈 없이, 환경변수에서 읽어옴)
    )
    BAROBILL_USE_TEST_SERVER: bool = (
        False  # 테스트 서버 사용 여부 (운영: false, 테스트: true)
    )

    def __init__(self, **kwargs):
        """Settings 초기화 및 환경변수 존재 여부 로깅"""
        super().__init__(**kwargs)

        # Cloud Run 디버깅을 위한 환경변수 존재 여부 로깅 (값은 절대 출력하지 않음)
        barobill_cert_key_exists = os.getenv("BAROBILL_CERT_KEY") is not None
        barobill_corp_num_exists = os.getenv("BAROBILL_CORP_NUM") is not None

        logger.info(
            f"바로빌 환경변수 확인 - "
            f"BAROBILL_CERT_KEY 존재: {barobill_cert_key_exists}, "
            f"BAROBILL_CORP_NUM 존재: {barobill_corp_num_exists}"
        )

        # 앱 시작 시 필수 설정 검증
        self._validate_required_settings()

    def _validate_required_settings(self):
        """앱 시작 시 필수 설정 검증"""
        if not self.SECRET_KEY:
            raise RuntimeError(
                "SECRET_KEY가 설정되지 않았습니다. "
                "환경변수(.env 또는 Cloud Run 환경변수)에 SECRET_KEY를 설정해주세요."
            )

    def is_barobill_configured(self) -> bool:
        """
        바로빌 설정이 완료되었는지 확인 (조회용, Optional 반환 함수에서 사용)

        Returns:
            바로빌 인증키와 사업자번호가 모두 설정되어 있으면 True, 아니면 False
        """
        return bool(self.BAROBILL_CERT_KEY and self.BAROBILL_CORP_NUM)

    def validate_barobill(self):
        """
        바로빌 API 호출 전 필수 설정 검증 (실제 HTTP 요청 전에 호출)

        Raises:
            RuntimeError: BAROBILL_CERT_KEY 또는 BAROBILL_CORP_NUM이 설정되지 않은 경우
        """
        if not self.BAROBILL_CERT_KEY:
            raise RuntimeError(
                "바로빌 API 호출 실패: BAROBILL_CERT_KEY가 설정되지 않았습니다. "
                "환경변수(.env 또는 Cloud Run 환경변수)에 BAROBILL_CERT_KEY를 설정해주세요."
            )

        if not self.BAROBILL_CORP_NUM:
            raise RuntimeError(
                "바로빌 API 호출 실패: BAROBILL_CORP_NUM이 설정되지 않았습니다. "
                "환경변수(.env 또는 Cloud Run 환경변수)에 BAROBILL_CORP_NUM을 설정해주세요."
            )

    @property
    def database_url(self) -> str:
        """
        Cloud Run에서는 DATABASE_URL 하나만 사용
        예:
        mysql+pymysql://user:password@IP:3306/dbname
        """
        return self.DATABASE_URL

    model_config = SettingsConfigDict(
        # 로컬 개발용 (.env)
        # Cloud Run에서는 무시됨
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
        populate_by_name=True,  # 환경변수 이름 매칭 개선
    )


settings = Settings()
