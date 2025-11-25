@echo off
echo Sprint 2.5: Export in Multiple Formats - Setup Script
echo ======================================================
echo.

cd /d d:\0_AI_Projects\0_careersie\apps\web

echo Creating directory structure...

mkdir "src\services" 2>nul
mkdir "src\templates\export" 2>nul
mkdir "app\api\export\pdf" 2>nul
mkdir "app\api\export\docx" 2>nul
mkdir "app\api\export\linkedin" 2>nul
mkdir "app\api\export\seek" 2>nul
mkdir "app\api\export\text" 2>nul
mkdir "app\api\export\history" 2>nul
mkdir "src\components\export" 2>nul
mkdir "public\exports" 2>nul

echo   ✓ Directories created
echo.

echo Installing required dependencies...
call pnpm add puppeteer handlebars docx date-fns
call pnpm add -D @types/puppeteer @types/handlebars

echo.
echo   ✓ Dependencies installed
echo.
echo Setup complete! Next steps:
echo   1. Run the Prisma migration
echo   2. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file
echo   3. Review and test the implementation
echo.
pause
