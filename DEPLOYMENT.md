# Deployment Guide - Tenant Intelligence System

This guide covers multiple deployment options for the Tenant Intelligence System, from local development to production deployment.

## Quick Start (Local Development)

```bash
# Clone and setup
git clone <repository-url>
cd tenant-intelligence-system
npm run demo:setup

# Start development servers
npm run dev
```

Access at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Production Deployment Options

### Option 1: Traditional Server Deployment

#### Prerequisites
- Node.js 18+ 
- 2GB+ RAM
- 10GB+ disk space

#### Steps

1. **Build for production:**
   ```bash
   npm run build:production
   ```

2. **Deploy the built files:**
   ```bash
   # Copy dist/production/ to your server
   scp -r dist/production/ user@server:/opt/tenant-intelligence/
   ```

3. **Setup on server:**
   ```bash
   cd /opt/tenant-intelligence
   
   # Configure environment
   cd server
   cp .env.example .env
   # Edit .env with your settings
   
   # Initialize database
   npm run db:init
   npm run db:seed
   
   # Start application
   npm start
   ```

4. **Setup process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name tenant-intelligence
   pm2 startup
   pm2 save
   ```

### Option 2: Docker Deployment

#### Single Container
```bash
# Build image
docker build -t tenant-intelligence .

# Run container
docker run -d \
  --name tenant-intelligence \
  -p 3001:3001 \
  -v tenant_data:/app/server/data \
  -v tenant_uploads:/app/server/uploads \
  tenant-intelligence
```

#### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# With Nginx reverse proxy
docker-compose --profile production up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: Cloud Platform Deployment

#### Heroku
```bash
# Install Heroku CLI and login
heroku create tenant-intelligence-demo

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secure-secret

# Deploy
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
railway login
railway init
railway up
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set run command: `npm start`
4. Configure environment variables

## Environment Configuration

### Required Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | development | Yes |
| `PORT` | Server port | 3001 | Yes |
| `DATABASE_PATH` | SQLite database file path | ./tenant_intelligence.db | Yes |
| `UPLOAD_DIR` | File upload directory | ./uploads | Yes |
| `SESSION_SECRET` | Session encryption key | - | Yes |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_FILE_SIZE` | Max upload size in bytes | 5242880 (5MB) |
| `ALLOWED_ORIGINS` | CORS allowed origins | http://localhost:3000 |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit per window | 100 |
| `LOG_LEVEL` | Logging level | info |
| `DEMO_MODE` | Enable demo features | true |

## Security Considerations

### Production Security Checklist

- [ ] Change default `SESSION_SECRET`
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

### SSL/HTTPS Setup

#### With Nginx (Recommended)
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### With Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check application health
curl http://localhost:3001/api/health

# Check with Docker
docker-compose exec tenant-intelligence npm run health
```

### Log Management
```bash
# View application logs
tail -f server/logs/app.log

# Docker logs
docker-compose logs -f tenant-intelligence

# PM2 logs
pm2 logs tenant-intelligence
```

### Database Backup
```bash
# Backup SQLite database
cp server/data/tenant_intelligence.db backup/tenant_intelligence_$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
BACKUP_DIR="/opt/backups"
DB_PATH="/opt/tenant-intelligence/server/data/tenant_intelligence.db"
DATE=$(date +%Y%m%d_%H%M%S)
cp "$DB_PATH" "$BACKUP_DIR/tenant_intelligence_$DATE.db"
find "$BACKUP_DIR" -name "tenant_intelligence_*.db" -mtime +7 -delete
```

### Updates and Maintenance
```bash
# Update application
git pull origin main
npm run build:production

# Restart services
pm2 restart tenant-intelligence
# OR
docker-compose restart
```

## Performance Optimization

### Production Optimizations

1. **Enable gzip compression** (Nginx)
2. **Set up CDN** for static assets
3. **Database optimization:**
   ```sql
   PRAGMA journal_mode=WAL;
   PRAGMA synchronous=NORMAL;
   PRAGMA cache_size=10000;
   ```
4. **File upload optimization:**
   - Image compression
   - File type validation
   - Size limits

### Scaling Considerations

- **Horizontal scaling:** Use load balancer with multiple instances
- **Database:** Consider PostgreSQL for high-traffic deployments
- **File storage:** Use cloud storage (AWS S3, etc.) for uploads
- **Caching:** Implement Redis for session storage and caching

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>
```

#### Database Locked
```bash
# Check for zombie processes
ps aux | grep node
# Restart application
pm2 restart tenant-intelligence
```

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la server/uploads/
# Fix permissions
chmod 755 server/uploads/
chown -R app:app server/uploads/
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
npm start

# Or with Docker
docker-compose up -d
docker-compose logs -f
```

## Support and Resources

- **Demo Data:** See `DEMO_DATA.md` for demo scenarios
- **API Documentation:** Available at `/api` endpoint
- **Health Check:** Available at `/api/health`
- **Development:** See `DEVELOPMENT.md` for development setup

For production support, monitor logs and set up alerting for:
- Application errors
- High memory usage
- Disk space
- Response time degradation