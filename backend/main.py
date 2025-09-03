"""
Main FastAPI application with all routers including authentication
"""
import logging
from contextlib import asynccontextmanager

from inventory_api import app
from invoice_api import invoice_router
from settings_api import settings_router
from analytics_basic import router as analytics_router
from analytics_premium import router as premium_analytics_router
# Use simple auth API for now
from simple_auth_api import router as auth_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple initialization message
logger.info("🔐 Using simple authentication system")
logger.info("📋 Admin credentials: admin / College@2025")

# Include the authentication router
app.include_router(auth_router, tags=["authentication"])

# Include the invoice router with proper prefix
app.include_router(invoice_router, prefix="/api/invoices", tags=["invoices"])

# Include the settings router with proper prefix
app.include_router(settings_router, prefix="/api/settings", tags=["settings"])

# Include the analytics router with proper prefix
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])

# Include the premium analytics router with proper prefix
app.include_router(premium_analytics_router, prefix="/api/analytics", tags=["premium-analytics"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
