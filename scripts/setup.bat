@echo off
REM Tenant Intelligence System Setup Script for Windows

echo 🏠 Setting up Tenant Intelligence System...

REM Check Node.js version
echo 📋 Checking Node.js version...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node -v') do set node_major=%%a
set node_major=%node_major:~1%
if %node_major% LSS 18 (
    echo ❌ Node.js 18+ is required. Current version: 
    node -v
    exit /b 1
)

echo ✅ Node.js version: 
node -v

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Build shared package first
echo 🔨 Building shared package...
npm run build:shared
if errorlevel 1 (
    echo ❌ Failed to build shared package
    exit /b 1
)

REM Copy environment files
echo ⚙️ Setting up environment files...
if not exist "server\.env" (
    copy "server\.env.example" "server\.env" >nul
    echo ✅ Created server/.env from example
)

if not exist "client\.env" (
    copy "client\.env.example" "client\.env" >nul
    echo ✅ Created client/.env from example
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist "server\uploads" mkdir "server\uploads"
if not exist "server\data" mkdir "server\data"
echo ✅ Created upload and data directories

REM Run basic tests to verify setup
echo 🧪 Running basic tests...
npm run test:unit
if errorlevel 1 (
    echo ⚠️ Some tests failed, but setup is complete
) else (
    echo ✅ All tests passed
)

echo.
echo 🎉 Setup complete!
echo.
echo To start development:
echo   npm run dev
echo.
echo This will start:
echo   - Frontend: http://localhost:3000
echo   - Backend: http://localhost:3001
echo.
echo Other useful commands:
echo   npm test              # Run all tests
echo   npm run build         # Build for production
echo   npm run lint          # Check code style
echo.