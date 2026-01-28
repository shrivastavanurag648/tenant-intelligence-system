#!/bin/bash

# Tenant Intelligence System Setup Script

echo "🏠 Setting up Tenant Intelligence System..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build shared package first
echo "🔨 Building shared package..."
npm run build:shared

if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package"
    exit 1
fi

# Copy environment files
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
mkdir -p server/uploads
mkdir -p server/data
echo "✅ Created upload and data directories"

# Run basic tests to verify setup
echo "🧪 Running basic tests..."
npm run test:unit

if [ $? -ne 0 ]; then
    echo "⚠️ Some tests failed, but setup is complete"
else
    echo "✅ All tests passed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "  npm run dev"
echo ""
echo "This will start:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend: http://localhost:3001"
echo ""
echo "Other useful commands:"
echo "  npm test              # Run all tests"
echo "  npm run build         # Build for production"
echo "  npm run lint          # Check code style"
echo ""