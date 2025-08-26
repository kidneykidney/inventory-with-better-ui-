"""
Main FastAPI application with all routers included
"""
from inventory_api import app
from invoice_api import invoice_router

# Include the invoice router
app.include_router(invoice_router, prefix="/api/invoices", tags=["invoices"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
