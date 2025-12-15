from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.db.session import test_db_connection, engine, Base


app = FastAPI(
    title="Invoice App API",
    description="FastAPI 기반 인보이스 관리 API",
    version="1.0.0",
)


# ======================================================
# ⚠️ DB 초기화 엔드포인트 (초기 1회용)
# ======================================================
@app.post("/__init_db")
def init_db_endpoint():
    """
    Cloud Run 환경에서 DB 테이블을 최초 1회 생성하기 위한 엔드포인트

    ⚠️ 주의
    - 운영 안정화 후 반드시 제거하거나 관리자 인증 뒤로 숨길 것
    """
    try:
        # 🔥 중요: 모든 모델 모듈을 import 해야 Base.metadata에 등록됨
        from app.models import (
            user,
            user_profile,
            invoice,
            supplier,
            recipient,
            client,
            company,
            usage_log,
            billing_cycle,
            payment,
            payment_method,
            free_quota,
            free_quota_history,
            tax_invoice_issue,
            session,
            device_session,
            corp_state_history,
            billing_charge,
        )

        Base.metadata.create_all(bind=engine)

        return {
            "status": "ok",
            "message": "tables created successfully",
        }

    except Exception as e:
        # Cloud Run 로그에 에러 남기기
        print("❌ DB init failed:", e)
        return {
            "status": "error",
            "message": str(e),
        }


# ======================================================
# CORS 설정
# ======================================================
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================================================
# API Router
# ======================================================
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# ======================================================
# Startup 이벤트
# ======================================================
@app.on_event("startup")
async def startup_event():
    """
    애플리케이션 시작 시 실행

    - DB 연결 테스트만 수행
    - 테이블 자동 생성 ❌ (운영 환경 안전)
    """
    print("🚀 Application startup: testing DB connection...")
    ok = test_db_connection()

    if ok:
        print("✅ DB connection successful")
    else:
        print("❌ DB connection failed")


# ======================================================
# 기본 엔드포인트
# ======================================================
@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "message": "Invoice App API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# ======================================================
# 로컬 실행용
# ======================================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
