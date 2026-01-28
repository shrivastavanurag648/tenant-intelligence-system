@echo off
REM Production Build Script for Tenant Intelligence System (Windows)

echo 🏗️ Building Tenant Intelligence System for Production...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory
    exit /b 1
)

REM Clean previous builds
echo 🧹 Cleaning previous builds...
npm run clean

REM Install dependencies
echo 📦 Installing production dependencies...
npm ci --only=production

REM Build shared package first
echo 🔨 Building shared package...
npm run build:shared
if errorlevel 1 (
    echo ❌ Failed to build shared package
    exit /b 1
)

REM Build server
echo 🖥️ Building server...
npm run build:server
if errorlevel 1 (
    echo ❌ Failed to build server
    exit /b 1
)

REM Build client
echo 🌐 Building client...
npm run build:client
if errorlevel 1 (
    echo ❌ Failed to build client
    exit /b 1
)

REM Create production directory structure
echo 📁 Creating production directory structure...
if not exist "dist\production" mkdir "dist\production"
if not exist "dist\production\server" mkdir "dist\production\server"
if not exist "dist\production\client" mkdir "dist\production\client"
if not exist "dist\production\shared" mkdir "dist\production\shared"

REM Copy built files
echo 📋 Copying built files...
xcopy /E /I "server\dist\*" "dist\production\server\"
xcopy /E /I "client\dist\*" "dist\production\client\"
xcopy /E /I "shared\dist\*" "dist\production\shared\"

REM Copy necessary configuration files
copy "server\package.json" "dist\production\server\"
copy "server\.env.example" "dist\production\server\"
copy "package.json" "dist\production\"

REM Create production directories
if not exist "dist\production\server\uploads\evidence" mkdir "dist\production\server\uploads\evidence"
if not exist "dist\production\server\data" mkdir "dist\production\server\data"

REM Create production package.json
echo { > "dist\production\package.json"
echo   "name": "tenant-intelligence-system-production", >> "dist\production\package.json"
echo   "version": "1.0.0", >> "dist\production\package.json"
echo   "description": "Production build of Tenant Intelligence System", >> "dist\production\package.json"
echo   "main": "server/index.js", >> "dist\production\package.json"
echo   "scripts": { >> "dist\production\package.json"
echo     "start": "cd server && node index.js", >> "dist\production\package.json"
echo     "db:init": "cd server && node -e \"require('./database/init.js').initializeDatabase()\"", >> "dist\production\package.json"
echo     "db:seed": "cd server && node -e \"require('./database/seed.js').seedDatabase()\"" >> "dist\production\package.json"
echo   }, >> "dist\production\package.json"
echo   "engines": { >> "dist\production\package.json"
echo     "node": "^>=18.0.0" >> "dist\production\package.json"
echo   } >> "dist\production\package.json"
echo } >> "dist\production\package.json"

echo.
echo ✅ Production build completed successfully!
echo.
echo 📦 Production files are in: dist\production\
echo.
echo 🚀 To deploy:
echo   1. Copy dist\production\ to your server
echo   2. Run: npm start
echo   3. Access at: http://your-server:3001
echo.