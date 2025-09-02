"""
Main FastAPI application with all routers included
"""
from inventory_api import app
from invoice_api import invoice_router
from settings_api import settings_router
from analytics_basic import router as analytics_router

# Include the invoice router with proper prefix
app.include_router(invoice_router, prefix="/api/invoices", tags=["invoices"])

# Include the settings router with proper prefix
app.include_router(settings_router, prefix="/api/settings", tags=["settings"])

# Include the analytics router with proper prefix
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
