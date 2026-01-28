/**
 * Main server entry point for Tenant Intelligence System
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './database/connection';
import complaintRoutes from './routes/complaints';
import evidenceRoutes from './routes/evidence';
import profileRoutes from './routes/profiles';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Session configuration for upvote tracking
app.use(session({
  secret: process.env.SESSION_SECRET || 'tenant-intelligence-dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/profiles', profileRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Tenant Intelligence System API',
    version: '1.0.0',
    endpoints: {
      complaints: '/api/complaints',
      evidence: '/api/evidence',
      profiles: '/api/profiles',
      buildings: '/api/profiles/buildings',
      landlords: '/api/profiles/landlords',
      statistics: '/api/statistics',
      upload: '/api/upload',
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API docs: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  startServer();
}

export default app;