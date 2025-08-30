@echo off
REM Quick Fix for Setup Issues
REM This will try to install dependencies with alternative approaches

title Quick Fix - Dependency Installation

echo 🔧 Quick Fix for Setup Issues
echo ==============================
echo.

echo 📦 Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo 🔄 Upgrading pip and build tools...
python -m pip install --upgrade pip
python -m pip install --upgrade setuptools wheel build

echo.
echo 🔧 Installing essential packages first...
pip install fastapi uvicorn pydantic python-multipart python-dotenv
pip install sqlalchemy httpx python-dateutil

echo.
echo 🎨 Installing data processing packages...
pip install numpy
pip install pandas || echo "⚠️ Pandas failed - this is optional"
pip install openpyxl || echo "⚠️ OpenPyXL failed - this is optional"

echo.
echo 🖼️ Installing image processing packages...
echo    Note: These may fail on some systems, but the app will still work
pip install --only-binary=all Pillow || echo "⚠️ Pillow failed - OCR will be limited"
pip install opencv-python-headless || pip install opencv-python || echo "⚠️ OpenCV failed - OCR will be limited"
pip install pytesseract || echo "⚠️ PyTesseract failed - OCR will be limited"

echo.
echo ✅ Quick fix complete!
echo.
echo 🚀 Now try running: .\start-system.bat
echo.
echo 💡 Notes:
echo    • The system should work even if some packages failed
echo    • OCR features may be limited without image processing libraries
echo    • You can install Tesseract manually for full OCR: https://github.com/UB-Mannheim/tesseract/wiki
echo.

pause
