// Vercel serverless function entry point
const path = require('path');

// Set up environment for production
process.env.NODE_ENV = 'production';
process.env.DATABASE_PATH = '/tmp/tenant_intelligence.db';
process.env.UPLOAD_DIR = '/tmp/uploads';

// Import the production server
const app = require('../server/dist/production.js');

module.exports = app;