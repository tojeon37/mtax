# 계발이 - 전자세금계산서 발행 시스템

바로빌 API를 활용한 전자세금계산서 발행 및 관리 시스템입니다.

## 프로젝트 개요

이 프로젝트는 바로빌(BaroBill) API를 연동하여 전자세금계산서를 발행하고 관리하는 풀스택 웹 애플리케이션입니다.

### 주요 기능

- **전자세금계산서 발행**: 바로빌 API를 통한 전자세금계산서 등록 및 발행
- **거래처 관리**: 거래처 정보 등록 및 관리
- **회사 정보 관리**: 우리회사 정보 등록 및 관리
- **발행 내역 조회**: 발행한 세금계산서 내역 조회 및 상태 확인
- **인증서 관리**: 공동인증서 등록 및 유효성 확인
- **사용자 인증**: JWT 기반 인증 및 세션 관리
- **무료 쿼터 관리**: 신규 사용자 무료 발행 건수 제공
- **청구 및 결제**: 사용량 기반 청구 및 결제 수단 관리

## 기술 스택

### 백엔드
- **Python 3.10+**
- **FastAPI**: 웹 프레임워크
- **SQLAlchemy**: ORM
- **MariaDB/MySQL**: 데이터베이스
- **Zeep**: SOAP 클라이언트 (바로빌 API 연동)
- **PyJWT**: JWT 토큰 처리
- **Passlib**: 비밀번호 해싱

### 프론트엔드
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구
- **Tailwind CSS**: 스타일링
- **React Router**: 라우팅
- **Zustand**: 상태 관리
- **Axios**: HTTP 클라이언트

## 프로젝트 구조

```
.
├── backend/                 # 백엔드 애플리케이션
│   ├── app/
│   │   ├── api/v1/         # API 라우터
│   │   ├── core/           # 핵심 설정 및 보안
│   │   │   └── barobill/   # 바로빌 API 클라이언트
│   │   ├── models/         # 데이터베이스 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── services/       # 비즈니스 로직 레이어
│   │   ├── crud/           # 데이터베이스 CRUD
│   │   └── db/             # 데이터베이스 세션
│   ├── migrations/         # SQL 마이그레이션 파일
│   ├── requirements.txt    # Python 의존성
│   └── run.py             # 실행 스크립트
│
├── front/                  # 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── api/           # API 클라이언트
│   │   ├── components/    # React 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── store/         # 상태 관리 (Zustand)
│   │   └── utils/         # 유틸리티 함수
│   ├── package.json       # Node.js 의존성
│   └── vite.config.ts     # Vite 설정
│
└── docs/                   # 프로젝트 문서
```

## 설치 및 실행

### 사전 요구사항

- Python 3.10 이상
- Node.js 18 이상
- MariaDB 또는 MySQL 8.0 이상
- 바로빌 인증키 및 사업자번호

### 백엔드 설정

1. **가상환경 생성 및 활성화**

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. **의존성 설치**

```bash
pip install -r requirements.txt
```

3. **환경 변수 설정**

`backend/.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# 데이터베이스 설정
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=invoice_app

# 바로빌 설정
BAROBILL_CERT_KEY=your_cert_key
BAROBILL_CORP_NUM=your_corp_num
BAROBILL_USE_TEST_SERVER=false

# JWT 설정
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30
```

4. **데이터베이스 생성**

```sql
CREATE DATABASE invoice_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **마이그레이션 실행**

`backend/migrations/` 폴더의 SQL 파일들을 순서대로 실행하세요.

6. **백엔드 실행**

```bash
python run.py
```

서버는 `http://localhost:8000`에서 실행됩니다.

### 프론트엔드 설정

1. **의존성 설치**

```bash
cd front
npm install
```

2. **환경 변수 설정**

`front/.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

3. **개발 서버 실행**

```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

4. **프로덕션 빌드**

```bash
npm run build
```

빌드 결과물은 `front/dist/` 폴더에 생성됩니다.

## 주요 API 엔드포인트

### 인증
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `GET /api/v1/auth/me` - 현재 사용자 정보 조회
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/password/change` - 비밀번호 변경

### 세금계산서
- `POST /api/v1/barobill/tax-invoices/register` - 세금계산서 등록
- `POST /api/v1/barobill/tax-invoices/issue` - 세금계산서 발행
- `GET /api/v1/barobill/tax-invoices/{mgt_key}` - 세금계산서 조회
- `POST /api/v1/barobill/tax-invoices/states` - 세금계산서 상태 조회
- `DELETE /api/v1/barobill/tax-invoices/{mgt_key}` - 세금계산서 삭제

### 거래처 관리
- `GET /api/v1/clients` - 거래처 목록 조회
- `POST /api/v1/clients` - 거래처 등록
- `PUT /api/v1/clients/{id}` - 거래처 수정
- `DELETE /api/v1/clients/{id}` - 거래처 삭제

### 회사 정보 관리
- `GET /api/v1/companies` - 회사 목록 조회
- `POST /api/v1/companies` - 회사 등록
- `PUT /api/v1/companies/{id}` - 회사 정보 수정
- `DELETE /api/v1/companies/{id}` - 회사 삭제

### 인증서 관리
- `GET /api/v1/certificate/check` - 인증서 유효성 확인
- `GET /api/v1/certificate/regist-url` - 인증서 등록 URL 조회

### 사용량 및 청구
- `GET /api/v1/usage` - 사용 내역 조회
- `GET /api/v1/billing/cycles` - 청구서 목록 조회
- `GET /api/v1/billing/summary` - 청구 요약 조회

### 무료 쿼터
- `GET /api/v1/free-quota` - 무료 쿼터 조회

## API 문서

서버 실행 후 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 주요 페이지

### 인증
- `/login` - 로그인
- `/signup` - 회원가입

### 세금계산서
- `/invoice/quick` - 빠른 세금계산서 발행
- `/invoice/history` - 발행 내역 조회

### 관리
- `/clients` - 거래처 관리
- `/company` - 회사 정보 관리
- `/certificate` - 인증서 관리

### 설정
- `/settings` - 계정 설정
- `/settings/password` - 비밀번호 변경
- `/settings/sessions` - 세션 관리

### 청구
- `/billing` - 청구 대시보드
- `/billing/cycles` - 청구서 목록
- `/billing/usage` - 사용 내역

## 개발 가이드

### 백엔드 코드 구조

백엔드는 계층형 아키텍처를 따릅니다:

- **Router Layer** (`app/api/v1/`): HTTP 요청 처리
- **Service Layer** (`app/services/`): 비즈니스 로직
- **CRUD Layer** (`app/crud/`): 데이터베이스 작업
- **Model Layer** (`app/models/`): 데이터베이스 모델

### 프론트엔드 코드 구조

프론트엔드는 기능별로 모듈화되어 있습니다:

- **Pages**: 페이지 컴포넌트
- **Components**: 재사용 가능한 컴포넌트
- **Hooks**: 커스텀 훅 (비즈니스 로직 분리)
- **API**: API 클라이언트
- **Store**: 전역 상태 관리

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 문의

프로젝트 관련 문의사항이 있으시면 관리자에게 연락해주세요.
