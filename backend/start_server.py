#!/usr/bin/env python3

import asyncio
import uvicorn
from inventory_api import app

if __name__ == "__main__":
    print("Starting Inventory API Server...")
    print("Server will be available at http://localhost:8000")
    print("OCR endpoints available at /api/invoices/")
    
    # Configure and run the server
    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",  # Use localhost instead of 0.0.0.0
        port=8000,
        log_level="info",
        reload=False,  # Disable reload to prevent crashes
        access_log=True
    )
    server = uvicorn.Server(config)
    
    try:
        asyncio.run(server.serve())
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server error: {e}")
