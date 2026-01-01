from fastapi import APIRouter
from app.api.v1 import (
    auth,
    invoice,
    tax_invoice_barobill,
    supplier,
    recipient,
    barobill_member,
    tax_invoice_issue,
    client,
    company,
    sessions,
    account,
    favorite_item,
    usage,
    billing,
    payment,
    payment_method,
    free_quota,
    certificate,
)
from app.auth import refresh

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(refresh.router, prefix="/auth", tags=["auth"])
api_router.include_router(invoice.router, tags=["invoice"])
api_router.include_router(tax_invoice_barobill.router, tags=["barobill-tax-invoice"])
# api_router.include_router(supplier.router, tags=["supplier"])
# api_router.include_router(recipient.router, tags=["recipient"])
api_router.include_router(client.router, tags=["client"])
api_router.include_router(company.router, tags=["company"])
api_router.include_router(barobill_member.router, tags=["barobill-members"])
api_router.include_router(tax_invoice_issue.router, tags=["barobill-tax-invoices"])
api_router.include_router(sessions.router, tags=["sessions"])
api_router.include_router(account.router, prefix="/account", tags=["account"])
api_router.include_router(usage.router, prefix="/usage", tags=["usage"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(payment.router, prefix="/payment", tags=["payment"])
api_router.include_router(payment_method.router, prefix="/payment-methods", tags=["payment-methods"])
api_router.include_router(free_quota.router, prefix="/free-quota", tags=["free-quota"])
api_router.include_router(certificate.router, prefix="/certificate", tags=["certificate"])
api_router.include_router(favorite_item.router, tags=["favorite-items"])
