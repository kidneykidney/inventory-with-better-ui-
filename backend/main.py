import logging
from inventory_api import app
from invoice_api import invoice_router
from settings_api import settings_router
from analytics_basic import router as analytics_router
from analytics_premium import router as premium_analytics_router
from simple_auth_api import router as auth_router
from overdue_scheduler import overdue_scheduler, get_scheduler_status, manual_overdue_check

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    try:
        logger.info("🔧 Initializing automatic overdue notification system...")
        await overdue_scheduler.initialize()
        overdue_scheduler.start()
        logger.info("✅ Automatic overdue notification system is now active")
        logger.info("📅 Daily checks scheduled for 9:00 AM")
    except Exception as e:
        logger.error(f"Failed to start overdue scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    try:
        logger.info("🔄 Shutting down overdue notification system...")
        overdue_scheduler.stop()
        logger.info("✅ Overdue notification system stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {e}")

logger.info("=> Using simple authentication system")
logger.info("=> Admin credentials: admin / College@2025")
logger.info("=> Automatic overdue notification system will start with server")

app.include_router(auth_router, tags=["authentication"])
app.include_router(invoice_router, prefix="/api/invoices", tags=["invoices"])
app.include_router(settings_router, prefix="/api/settings", tags=["settings"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(premium_analytics_router, prefix="/api/analytics", tags=["premium-analytics"])

@app.get("/test")
async def test_endpoint():
    return {"message": "Server is working", "status": "ok"}

@app.get("/api/admin/scheduler/status")
async def get_scheduler_status_endpoint():
    try:
        status = get_scheduler_status()
        return {
            "message": "Scheduler status retrieved",
            "status": status,
            "success": True
        }
    except Exception as e:
        logger.error(f"Error getting scheduler status: {e}")
        return {
            "message": "Failed to get scheduler status",
            "error": str(e),
            "success": False
        }

@app.post("/api/admin/scheduler/manual-check")
async def trigger_manual_overdue_check():
    try:
        logger.info("Manual overdue check triggered by admin")
        await manual_overdue_check()
        return {
            "message": "Manual overdue check completed successfully",
            "success": True
        }
    except Exception as e:
        logger.error(f"Error in manual overdue check: {e}")
        return {
            "message": "Manual overdue check failed",
            "error": str(e),
            "success": False
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)