@echo off
REM Quick fix to reset the system and clear cache

title Reset System - Clear Data Issues

echo 🔧 Resetting System to Fix Emma Wilson Issue
echo ============================================

echo 🛑 Stopping all services...
call stop-system.bat

echo 🧹 Clearing browser cache data...
echo   Please manually clear your browser cache (Ctrl+Shift+Delete)
echo   Or hard refresh the page (Ctrl+F5) after restart

echo ⏳ Waiting 5 seconds...
timeout /t 5 /nobreak > nul

echo 🚀 Restarting system...
call start-dev.bat

echo ✅ System reset complete!
echo 
echo 💡 Next steps:
echo 1. Hard refresh browser (Ctrl+F5)
echo 2. Open Dev Tools (F12) and go to Console tab
echo 3. Try creating invoice with Sarah's image again
echo 4. Watch console for messages starting with 🔄 📝 ✅
echo
echo 📋 Expected logs:
echo    "🔄 Populating manual data from OCR: {student_name: 'Sarah Johnson'}"
echo    "✅ Updated student with fresh OCR data: Sarah Johnson"  
echo    "🎯 Using final student data: Name='Sarah Johnson'"
echo

pause
