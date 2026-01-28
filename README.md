# Tenant Intelligence System

A demo-ready web application that enables anonymous tenant complaint submission with AI-powered classification and community verification.

## Features

- **Anonymous Complaint Submission**: Submit housing issues without registration
- **AI-Powered Classification**: Automatic categorization into Safety, Maintenance, Sanitation, and Utilities
- **Community Verification**: Anonymous upvoting and evidence submission
- **Building & Landlord Profiles**: Aggregated complaint data and trends
- **Mobile-Friendly Interface**: Responsive design for all devices

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: SQLite (demo-ready)
- **Testing**: Jest + fast-check (property-based testing)
- **File Upload**: Multer with local storage

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run setup
   ```

3. Copy environment files:
   ```bash
   cp server/.env.example server/.env
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages for production
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests only
- `npm run test:property` - Run property-based tests only
- `npm run lint` - Lint all packages
- `npm run lint:fix` - Fix linting issues

## Project Structure

```
tenant-intelligence-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Client utilities
│   └── package.json
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── database/       # Database setup and queries
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Server utilities
│   └── package.json
├── shared/                 # Shared types and utilities
│   ├── src/
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── schemas.ts      # Zod validation schemas
│   │   ├── constants.ts    # Application constants
│   │   └── utils.ts        # Shared utilities
│   └── package.json
└── package.json           # Root package.json with workspaces
```

## Development Workflow

1. **Task-Based Development**: Follow the implementation plan in `.kiro/specs/tenant-intelligence-system/tasks.md`
2. **Test-Driven**: Write both unit tests and property-based tests for new features
3. **Type Safety**: Use TypeScript throughout with strict configuration
4. **Code Quality**: ESLint and Prettier for consistent code style

## Testing Strategy

### Unit Tests
- Specific examples and edge cases
- Component behavior and user interactions
- API endpoint functionality
- Database operations

### Property-Based Tests
- Data integrity across all inputs
- Classification accuracy and completeness
- Community verification workflows
- Profile aggregation correctness

Run tests with:
```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:property      # Property-based tests only
```

## API Endpoints

- `GET /api` - API information
- `POST /api/complaints` - Submit complaint
- `GET /api/complaints` - List complaints
- `GET /api/complaints/:id` - Get complaint details
- `POST /api/complaints/:id/upvote` - Upvote complaint
- `POST /api/evidence` - Submit evidence
- `GET /api/buildings/:address` - Building profile
- `GET /api/landlords/:id` - Landlord profile
- `POST /api/upload` - Upload images

## Environment Variables

See `server/.env.example` for all available configuration options.

## Contributing

1. Follow the task-based implementation plan
2. Write tests for new functionality
3. Ensure TypeScript compilation passes
4. Run linting and fix any issues
5. Test the application end-to-end

## License

This is a demo application for educational and demonstration purposes.