# Invoice App API

FastAPI 기반 인보이스 관리 백엔드 API 서버

## 기술 스택

- Python 3.10
- FastAPI
- Uvicorn
- SQLAlchemy ORM
- MariaDB (MySQL)
- 바로빌 API (zeep - SOAP 클라이언트)

## 프로젝트 구조

```
backend/
  app/
    __init__.py
    main.py
    core/
      config.py          # 환경변수 관리
      security.py        # 비밀번호 해싱
      barobill.py        # 바로빌 API 클라이언트
    api/
      __init__.py
      v1/
        __init__.py
        auth.py
        invoice.py
        tax_invoice_barobill.py  # 바로빌 세금계산서 API
    models/
      __init__.py
      user.py
      invoice.py
    schemas/
      __init__.py
      user.py
      invoice.py
      tax_invoice_barobill.py    # 바로빌 세금계산서 스키마
    services/
      __init__.py
      tax_invoice.py     # 세금계산서 서비스 레이어
    db/
      __init__.py
      session.py
  requirements.txt
  README.md
```

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. 의존성 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# 데이터베이스 설정
DB_USER=myuser
DB_PASSWORD=1234
DB_HOST=localhost
DB_PORT=3306
DB_NAME=invoice_app

# 바로빌 설정
BAROBILL_CERT_KEY=your_cert_key_here
BAROBILL_CORP_NUM=your_corp_num_here
BAROBILL_USE_TEST_SERVER=false  # 실전 서버 사용 (테스트 서버 사용 시 true)
```

**바로빌 설정 설명:**
- `BAROBILL_CERT_KEY`: 바로빌 인증키 (바로빌 관리자 페이지에서 발급)
- `BAROBILL_CORP_NUM`: 사업자번호 (하이픈 없이 입력)
- `BAROBILL_USE_TEST_SERVER`: 테스트 서버 사용 여부 (true/false)

### 4. 데이터베이스 생성

MariaDB에서 데이터베이스를 생성하세요:

```sql
CREATE DATABASE invoice_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 애플리케이션 실행

**방법 1: uvicorn 직접 사용 (권장)**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**방법 2: run.py 스크립트 사용**
```bash
cd backend
python run.py
```

**방법 3: main.py 직접 실행**
```bash
cd backend
python -m app.main
```

**주의사항:**
- 반드시 `backend` 디렉토리에서 실행해야 합니다.
- Python 경로에 `backend` 디렉토리가 포함되어 있어야 합니다.

## API 엔드포인트

### 헬스 체크
- `GET /health` - 서버 상태 확인

### 인증
- `POST /api/v1/auth/register` - 사용자 등록
- `GET /api/v1/auth/users` - 사용자 목록 조회

### 인보이스
- `POST /api/v1/invoices` - 인보이스 생성
- `GET /api/v1/invoices` - 인보이스 목록 조회
- `GET /api/v1/invoices/{invoice_id}` - 인보이스 상세 조회
- `PUT /api/v1/invoices/{invoice_id}` - 인보이스 업데이트
- `DELETE /api/v1/invoices/{invoice_id}` - 인보이스 삭제

### 바로빌 세금계산서
- `POST /api/v1/tax-invoices/register` - 세금계산서 등록
- `GET /api/v1/tax-invoices/{mgt_key}` - 세금계산서 조회
- `POST /api/v1/tax-invoices/states` - 세금계산서 상태 조회 (복수)
- `POST /api/v1/tax-invoices/issue` - 세금계산서 발행
- `DELETE /api/v1/tax-invoices/{mgt_key}` - 세금계산서 삭제

## API 문서

서버 실행 후 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 데이터베이스 마이그레이션

테이블을 생성하려면 SQLAlchemy를 사용하여 마이그레이션을 실행하거나, 직접 SQL을 실행할 수 있습니다.

Python 스크립트로 테이블 생성:

```python
from app.db.session import Base, engine
from app.models import user, invoice

Base.metadata.create_all(bind=engine)
```

