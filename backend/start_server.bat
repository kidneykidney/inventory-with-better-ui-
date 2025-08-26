@echo off
cd /d "C:\Users\User\inventory1\backend"
echo Starting Inventory Management Server...
echo OCR and Invoice System Ready
echo Server will be available at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

venv\Scripts\python.exe -c "
import uvicorn
from inventory_api import app
print('OCR libraries and Invoice API loaded successfully')
uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info', reload=False)
"

pause
