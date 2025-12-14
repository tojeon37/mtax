from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.core.config import settings
from app.db.session import test_db_connection, engine
from app.db.session import Base, engine


app = FastAPI(
    title="Invoice App API",
    description="FastAPI 기반 인보이스 관리 API",
    version="1.0.0",
)


@app.post("/__init_db")
def init_db_endpoint():
    Base.metadata.create_all(bind=engine)
    return {"status": "ok", "message": "tables created"}


# CORS 미들웨어 설정
# 주의: allow_credentials=True일 때는 allow_origins에 "*"를 사용할 수 없음
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    # 프론트 개발용
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 연결
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행"""
    # 데이터베이스 연결 테스트
    test_db_connection()

    # 테이블 자동 생성 (개발 환경용)
    try:
        from app.db.session import Base
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
        )

    except Exception:
        pass


@app.get("/health")
def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "ok"}


@app.get("/")
def root():
    """루트 엔드포인트"""
    return {"message": "Invoice App API", "version": "1.0.0", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
