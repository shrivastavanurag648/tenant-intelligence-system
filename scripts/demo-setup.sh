#!/bin/bash

# Tenant Intelligence System Demo Setup Script
# Prepares the system for demonstration with realistic data

echo "🎯 Setting up Tenant Intelligence System for Demo..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Build shared package
echo "🔨 Building shared package..."
npm run build:shared
if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package"
    exit 1
fi

# Set up environment files
echo "⚙️ Setting up environment files..."
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo "✅ Created server/.env from example"
fi

if [ ! -f "client/.env" ]; then
    cp client/.env.example client/.env
    echo "✅ Created client/.env from example"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p server/uploads/evidence
mkdir -p server/data
echo "✅ Created upload and data directories"

# Initialize database
echo "🗄️ Initializing database..."
cd server
npm run db:init
if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

# Seed with demo data
echo "🌱 Seeding database with realistic demo data..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

# Run demo analysis
echo "📊 Analyzing demo data patterns..."
npm run db:analyze
if [ $? -ne 0 ]; then
    echo "⚠️ Demo analysis failed, but data is seeded"
fi

cd ..

# Build the application
echo "🏗️ Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "⚠️ Build failed, but demo data is ready"
fi

echo ""
echo "🎉 Demo setup complete!"
echo ""
echo "📊 Demo Data Summary:"
echo "  - 25 realistic complaints across NYC"
echo "  - 8 landlords with different response patterns"
echo "  - 18 pieces of community evidence"
echo "  - Geographic clustering showing neighborhood trends"
echo "  - Clear patterns of repeat-offender landlords"
echo ""
echo "🚀 To start the demo:"
echo "  npm run dev"
echo ""
echo "This will start:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:3001"
echo ""
echo "🎯 Key Demo Scenarios:"
echo "  1. Search 'Slumlord Properties' - Shows repeat offender (0% resolution)"
echo "  2. Filter by 'Safety' - Shows Queens Village crisis pattern"
echo "  3. View '1247 Broadway' - Shows building with multiple heating issues"
echo "  4. Compare landlord profiles - Shows responsive vs negligent management"
echo ""
echo "📖 See DEMO_DATA.md for detailed demo scenarios and patterns"