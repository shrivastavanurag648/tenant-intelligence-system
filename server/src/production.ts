/**
 * Production server that serves both API and static frontend
 */

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { initializeDatabase } from './database/connection'
import complaintsRouter from './routes/complaints'
import evidenceRouter from './routes/evidence'
import profilesRouter from './routes/profiles'

// Load environment variables
dotenv.config({ path: '.env.production' })

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}))

// Logging
app.use(morgan('combined'))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files from client build
const clientBuildPath = path.join(__dirname, '../../client/dist')
app.use(express.static(clientBuildPath))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API routes
app.use('/api/complaints', complaintsRouter)
app.use('/api/evidence', evidenceRouter)
app.use('/api/profiles', profilesRouter)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  })
})

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Tenant Intelligence System API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      health: '/api/health',
      complaints: '/api/complaints',
      evidence: '/api/evidence',
      profiles: '/api/profiles'
    }
  })
})

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'))
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  })
})

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Initializing database...')
    await initializeDatabase()
    console.log('✅ Database initialized successfully')
    
    app.listen(PORT, () => {
      console.log(`🚀 Production server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
      console.log(`🌐 Application: http://localhost:${PORT}`)
      console.log(`🔗 API docs: http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()