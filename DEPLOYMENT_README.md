# Tenant Intelligence System - Deployment

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the application:
   ```bash
   npm run start:production
   ```

3. Access your app at: http://localhost:3001

## Environment Variables

Update `.env.production` with your settings:
- `SESSION_SECRET`: Change to a secure random string
- `ALLOWED_ORIGINS`: Set to your domain in production
- `PORT`: Change if needed (default: 3001)

## Features

- Anonymous complaint submission with image upload
- AI-powered issue classification
- Community verification with upvoting
- Building and landlord profiles
- Mobile-responsive design
- 25 demo complaints pre-loaded

## Health Check

Visit `/api/health` to check if the application is running properly.

## Support

For issues, check the logs and ensure all dependencies are installed.
