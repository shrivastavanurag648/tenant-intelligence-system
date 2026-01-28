#!/usr/bin/env node

/**
 * Simple deployment script for Tenant Intelligence System
 * This script prepares the application for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing Tenant Intelligence System for deployment...\n');

try {
  // Step 1: Build all packages
  console.log('📦 Building all packages...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed\n');

  // Step 2: Create deployment package info
  const deploymentInfo = {
    name: 'tenant-intelligence-system',
    version: '1.0.0',
    description: 'Tenant Intelligence System - Production Ready',
    main: 'server/dist/production.js',
    scripts: {
      start: 'node server/dist/production.js',
      'start:production': 'npm run db:init && npm run db:seed && npm start',
      'db:init': 'node server/dist/database/init.js',
      'db:seed': 'node server/dist/database/seed.js',
      health: 'curl http://localhost:3001/api/health || echo "Health check failed"'
    },
    engines: {
      node: '>=18.0.0',
      npm: '>=9.0.0'
    },
    dependencies: {
      express: '^4.18.2',
      cors: '^2.8.5',
      helmet: '^7.1.0',
      morgan: '^1.10.0',
      multer: '^1.4.5-lts.1',
      sqlite3: '^5.1.6',
      uuid: '^9.0.1',
      zod: '^3.22.4',
      dotenv: '^16.3.1',
      'express-session': '^1.19.0'
    }
  };

  // Step 3: Create production environment file
  const prodEnv = `# Production Environment Configuration
NODE_ENV=production
PORT=3001
DATABASE_PATH=./data/tenant_intelligence.db
UPLOAD_DIR=./uploads
SESSION_SECRET=change-this-in-production-to-a-secure-random-string
MAX_FILE_SIZE=5242880
ALLOWED_ORIGINS=*
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
DEMO_MODE=true`;

  fs.writeFileSync('server/.env.production', prodEnv);
  console.log('✅ Production environment file created');

  // Step 4: Create deployment README
  const deploymentReadme = `# Tenant Intelligence System - Deployment

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the application:
   \`\`\`bash
   npm run start:production
   \`\`\`

3. Access your app at: http://localhost:3001

## Environment Variables

Update \`.env.production\` with your settings:
- \`SESSION_SECRET\`: Change to a secure random string
- \`ALLOWED_ORIGINS\`: Set to your domain in production
- \`PORT\`: Change if needed (default: 3001)

## Features

- Anonymous complaint submission with image upload
- AI-powered issue classification
- Community verification with upvoting
- Building and landlord profiles
- Mobile-responsive design
- 25 demo complaints pre-loaded

## Health Check

Visit \`/api/health\` to check if the application is running properly.

## Support

For issues, check the logs and ensure all dependencies are installed.
`;

  fs.writeFileSync('DEPLOYMENT_README.md', deploymentReadme);
  console.log('✅ Deployment README created');

  console.log('\n🎉 Deployment preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Choose a deployment platform (Railway, Render, Heroku, etc.)');
  console.log('2. Push your code to GitHub (if not already)');
  console.log('3. Connect your repo to the deployment platform');
  console.log('4. Set build command: npm run build');
  console.log('5. Set start command: npm start');
  console.log('6. Deploy and share your URL!');
  console.log('\n🌐 Your app will be accessible to everyone on the internet!');

} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}