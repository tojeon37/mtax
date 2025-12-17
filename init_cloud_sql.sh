#!/bin/bash

# 오류 발생 시 즉시 중단
set -e

# =========================
# 환경변수 설정
# =========================
CLOUD_SQL_IP="34.47.71.188"
CLOUD_SQL_USER="root"
CLOUD_SQL_DBNAME="mtax"

# 비밀번호는 export로 받아야 함
if [ -z "$CLOUD_SQL_PASSWORD" ]; then
    echo "❌ 오류: CLOUD_SQL_PASSWORD 환경변수가 설정되지 않았습니다."
    echo "사용법: export CLOUD_SQL_PASSWORD=\"비밀번호\" && bash init_cloud_sql.sh"
    exit 1
fi

echo "=========================================="
echo "Cloud SQL 초기화 및 마이그레이션 스크립트"
echo "=========================================="
echo ""

# =========================
# 1. Cloud SQL 접속 테스트
# =========================
echo "📡 Cloud SQL 접속 테스트 중..."
if ! mysql -h "$CLOUD_SQL_IP" -u "$CLOUD_SQL_USER" -p"$CLOUD_SQL_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ 오류: Cloud SQL 접속에 실패했습니다."
    echo "   IP: $CLOUD_SQL_IP"
    echo "   User: $CLOUD_SQL_USER"
    exit 1
fi
echo "✅ Cloud SQL 접속 성공"
echo ""

# =========================
# 2. 데이터베이스 생성
# =========================
echo "🗄️  데이터베이스 생성 중..."
mysql -h "$CLOUD_SQL_IP" -u "$CLOUD_SQL_USER" -p"$CLOUD_SQL_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $CLOUD_SQL_DBNAME 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
EOF
echo "✅ 데이터베이스 '$CLOUD_SQL_DBNAME' 생성 완료"
echo ""

# =========================
# 3. 가장 최근 SQL 파일 찾기
# =========================
MIGRATIONS_DIR="backend/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ 오류: $MIGRATIONS_DIR 디렉토리를 찾을 수 없습니다."
    exit 1
fi

# migrations 폴더에서 .sql 파일 찾기
# Windows Git Bash 호환: ls -t 사용 (수정 시간 역순)
LATEST_SQL_FILE=""
if command -v ls > /dev/null 2>&1; then
    # ls -t로 수정 시간 역순 정렬, 첫 번째 파일 선택
    LATEST_SQL_FILE=$(ls -t "$MIGRATIONS_DIR"/*.sql 2>/dev/null | head -1)
fi

# 대체 방법: find 사용 (Linux/Mac)
if [ -z "$LATEST_SQL_FILE" ] || [ ! -f "$LATEST_SQL_FILE" ]; then
    if command -v find > /dev/null 2>&1; then
        # find로 파일 찾기 (수정 시간 기준)
        LATEST_SQL_FILE=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    fi
fi

# 여전히 파일을 찾지 못한 경우
if [ -z "$LATEST_SQL_FILE" ] || [ ! -f "$LATEST_SQL_FILE" ]; then
    echo "❌ 오류: $MIGRATIONS_DIR 디렉토리에서 SQL 파일을 찾을 수 없습니다."
    exit 1
fi

# 파일 경로 정규화 (공백 처리)
# Windows 경로 변환 (필요시)
if [[ "$LATEST_SQL_FILE" == *"\\"* ]]; then
    LATEST_SQL_FILE=$(echo "$LATEST_SQL_FILE" | sed 's|\\|/|g')
fi

echo "📄 선택된 SQL 파일: $LATEST_SQL_FILE"
echo ""

# =========================
# 4. SQL 파일 업로드
# =========================
echo "⬆️  SQL 파일 업로드 중..."
if mysql -h "$CLOUD_SQL_IP" -u "$CLOUD_SQL_USER" -p"$CLOUD_SQL_PASSWORD" "$CLOUD_SQL_DBNAME" < "$LATEST_SQL_FILE"; then
    echo ""
    echo "=========================================="
    echo "✅ 성공!"
    echo "=========================================="
    echo "데이터베이스: $CLOUD_SQL_DBNAME"
    echo "업로드된 파일: $LATEST_SQL_FILE"
    echo "Cloud SQL 초기화가 완료되었습니다."
else
    echo ""
    echo "❌ 오류: SQL 파일 업로드에 실패했습니다."
    exit 1
fi
