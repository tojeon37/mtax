from app.db.session import engine, Base

# 모델들을 반드시 import 해야 테이블이 생성됨
import app.models.user
import app.models.company
import app.models.invoice
import app.models.payment_method
import app.models.free_quota
import app.models.billing_cycle
import app.models.usage_log

Base.metadata.create_all(bind=engine)

print("✅ tables created")
