#!/bin/bash

# Production Build Script for Tenant Intelligence System

echo "🏗️ Building Tenant Intelligence System for Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Build shared package first
echo "🔨 Building shared package..."
npm run build:shared
if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package"
    exit 1
fi

# Build server
echo "🖥️ Building server..."
npm run build:server
if [ $? -ne 0 ]; then
    echo "❌ Failed to build server"
    exit 1
fi

# Build client
echo "🌐 Building client..."
npm run build:client
if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi

# Create production directory structure
echo "📁 Creating production directory structure..."
mkdir -p dist/production
mkdir -p dist/production/server
mkdir -p dist/production/client
mkdir -p dist/production/shared

# Copy built files
echo "📋 Copying built files..."
cp -r server/dist/* dist/production/server/
cp -r client/dist/* dist/production/client/
cp -r shared/dist/* dist/production/shared/

# Copy necessary configuration files
cp server/package.json dist/production/server/
cp server/.env.example dist/production/server/
cp package.json dist/production/

# Copy database and upload directories
mkdir -p dist/production/server/uploads/evidence
mkdir -p dist/production/server/data

# Create production package.json
cat > dist/production/package.json << EOF
{
  "name": "tenant-intelligence-system-production",
  "version": "1.0.0",
  "description": "Production build of Tenant Intelligence System",
  "main": "server/index.js",
  "scripts": {
    "start": "cd server && node index.js",
    "db:init": "cd server && node -e \"require('./database/init.js').initializeDatabase()\"",
    "db:seed": "cd server && node -e \"require('./database/seed.js').seedDatabase()\"",
    "health": "curl -f http://localhost:3001/api/health || exit 1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create deployment README
cat > dist/production/README.md << EOF
# Tenant Intelligence System - Production Deployment

## Quick Start

1. **Install Node.js 18+**
2. **Set up environment:**
   \`\`\`bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. **Initialize database:**
   \`\`\`bash
   npm run db:init
   npm run db:seed
   \`\`\`

4. **Start the application:**
   \`\`\`bash
   npm start
   \`\`\`

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Environment Variables

Create \`server/.env\` with:

\`\`\`
NODE_ENV=production
PORT=3001
DATABASE_PATH=./tenant_intelligence.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_ORIGINS=http://localhost:3000
\`\`\`

## Health Check

\`\`\`bash
npm run health
\`\`\`

## File Structure

- \`server/\` - Express.js backend
- \`client/\` - React frontend (static files)
- \`shared/\` - Shared TypeScript types

## Demo Data

The system includes realistic demo data showing:
- 25 complaints across NYC
- 8 landlords with different response patterns
- Geographic clustering of issues
- Community verification examples

## Support

For issues, check the logs in \`server/\` directory.
EOF

echo ""
echo "✅ Production build completed successfully!"
echo ""
echo "📦 Production files are in: dist/production/"
echo ""
echo "🚀 To deploy:"
echo "  1. Copy dist/production/ to your server"
echo "  2. Run: npm start"
echo "  3. Access at: http://your-server:3001"
echo ""
echo "📖 See dist/production/README.md for detailed instructions"