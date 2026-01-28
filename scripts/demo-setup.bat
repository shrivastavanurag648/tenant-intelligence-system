@echo off
REM Tenant Intelligence System Demo Setup Script for Windows
REM Prepares the system for demonstration with realistic data

echo 🎯 Setting up Tenant Intelligence System for Demo...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory
    exit /b 1
)

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

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        exit /b 1
    )
)

REM Build shared package
echo 🔨 Building shared package...
npm run build:shared
if errorlevel 1 (
    echo ❌ Failed to build shared package
    exit /b 1
)

REM Set up environment files
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
if not exist "server\uploads\evidence" mkdir "server\uploads\evidence"
if not exist "server\data" mkdir "server\data"
echo ✅ Created upload and data directories

REM Initialize database
echo 🗄️ Initializing database...
cd server
npm run db:init
if errorlevel 1 (
    echo ❌ Failed to initialize database
    exit /b 1
)

REM Seed with demo data
echo 🌱 Seeding database with realistic demo data...
npm run db:seed
if errorlevel 1 (
    echo ❌ Failed to seed database
    exit /b 1
)

REM Run demo analysis
echo 📊 Analyzing demo data patterns...
npm run db:analyze
if errorlevel 1 (
    echo ⚠️ Demo analysis failed, but data is seeded
)

cd ..

REM Build the application
echo 🏗️ Building application...
npm run build
if errorlevel 1 (
    echo ⚠️ Build failed, but demo data is ready
)

echo.
echo 🎉 Demo setup complete!
echo.
echo 📊 Demo Data Summary:
echo   - 25 realistic complaints across NYC
echo   - 8 landlords with different response patterns
echo   - 18 pieces of community evidence
echo   - Geographic clustering showing neighborhood trends
echo   - Clear patterns of repeat-offender landlords
echo.
echo 🚀 To start the demo:
echo   npm run dev
echo.
echo This will start:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:3001
echo.
echo 🎯 Key Demo Scenarios:
echo   1. Search 'Slumlord Properties' - Shows repeat offender (0%% resolution)
echo   2. Filter by 'Safety' - Shows Queens Village crisis pattern
echo   3. View '1247 Broadway' - Shows building with multiple heating issues
echo   4. Compare landlord profiles - Shows responsive vs negligent management
echo.
echo 📖 See DEMO_DATA.md for detailed demo scenarios and patterns