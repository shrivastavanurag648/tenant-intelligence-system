# Development Guide

## Project Setup

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git

### Quick Setup

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd tenant-intelligence-system
   npm run setup
   ```

2. **Start development:**
   ```bash
   npm run dev
   ```

### Manual Setup

If the automated setup doesn't work:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build shared package:**
   ```bash
   npm run build:shared
   ```

3. **Copy environment files:**
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Create directories:**
   ```bash
   mkdir -p server/uploads server/data
   ```

## Development Workflow

### Task-Based Development

Follow the implementation plan in `.kiro/specs/tenant-intelligence-system/tasks.md`:

1. **Read the task requirements** in the tasks.md file
2. **Implement the functionality** following the design document
3. **Write tests** (both unit and property-based)
4. **Verify the implementation** meets acceptance criteria
5. **Move to the next task**

### Testing Strategy

#### Unit Tests
```bash
npm run test:unit          # Run all unit tests
npm run test:unit --workspace=shared    # Test specific package
```

#### Property-Based Tests
```bash
npm run test:property      # Run all property tests
```

#### All Tests
```bash
npm test                   # Run everything
```

### Code Quality

#### Linting
```bash
npm run lint              # Check all packages
npm run lint:fix          # Fix auto-fixable issues
```

#### Type Checking
```bash
npm run build             # Builds will fail on type errors
```

## Package Structure

### Shared Package (`shared/`)

Contains common types, schemas, and utilities used by both client and server.

**Key files:**
- `src/types.ts` - TypeScript interfaces and enums
- `src/schemas.ts` - Zod validation schemas
- `src/constants.ts` - Application constants
- `src/utils.ts` - Shared utility functions

**Development:**
```bash
cd shared
npm run dev               # Watch mode for development
npm run build             # Build for production
npm test                  # Run tests
```

### Server Package (`server/`)

Express.js backend with TypeScript.

**Key directories:**
- `src/routes/` - API route handlers
- `src/services/` - Business logic
- `src/database/` - Database setup and queries
- `src/middleware/` - Express middleware

**Development:**
```bash
cd server
npm run dev               # Start with hot reload
npm run build             # Build for production
npm test                  # Run tests
npm run db:init           # Initialize database
npm run db:seed           # Seed with demo data
```

### Client Package (`client/`)

React frontend with TypeScript, Vite, and Tailwind CSS.

**Key directories:**
- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/hooks/` - Custom React hooks
- `src/services/` - API services

**Development:**
```bash
cd client
npm run dev               # Start dev server
npm run build             # Build for production
npm test                  # Run tests
```

## API Development

### Adding New Endpoints

1. **Define types** in `shared/src/types.ts`
2. **Add validation schemas** in `shared/src/schemas.ts`
3. **Create route handler** in `server/src/routes/`
4. **Add business logic** in `server/src/services/`
5. **Write tests** for the endpoint
6. **Update API documentation**

### Database Operations

- Use SQLite for demo simplicity
- Database file: `server/data/tenant-intelligence.db`
- Schema: See `shared/src/types.ts` for structure
- Migrations: Manual for demo purposes

## Frontend Development

### Component Development

1. **Create component** in appropriate directory
2. **Add TypeScript interfaces** for props
3. **Use Tailwind CSS** for styling
4. **Write tests** with React Testing Library
5. **Add to Storybook** (if implemented)

### State Management

- **React Query** for server state
- **React hooks** for local state
- **Context** for global app state (if needed)

### Styling Guidelines

- **Tailwind CSS** for all styling
- **Responsive design** mobile-first
- **Accessibility** considerations
- **Consistent spacing** using Tailwind scale

## Testing Guidelines

### Unit Tests

Focus on:
- Individual function behavior
- Component rendering and interactions
- API endpoint responses
- Database operations
- Edge cases and error conditions

### Property-Based Tests

Focus on:
- Data integrity across all inputs
- System invariants and properties
- Classification accuracy
- Profile aggregation correctness
- File handling robustness

**Property test format:**
```typescript
// Feature: tenant-intelligence-system, Property 1: Comprehensive Data Collection
test('Property 1: Data collection stores exactly specified fields', () => {
  fc.assert(fc.property(
    complaintSubmissionArbitrary,
    (submission) => {
      // Test implementation
    }
  ));
});
```

### Test Organization

```
src/
├── component.tsx
├── component.test.tsx      # Unit tests
├── component.property.tsx  # Property-based tests
└── __tests__/             # Additional test files
```

## Environment Configuration

### Server Environment Variables

See `server/.env.example` for all options:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production/test)
- `DATABASE_URL` - SQLite database path
- `CLIENT_URL` - Frontend URL for CORS
- `UPLOAD_DIR` - File upload directory

### Client Environment Variables

See `client/.env.example`:

- `VITE_API_URL` - Backend API URL
- `VITE_APP_TITLE` - Application title

## Debugging

### Server Debugging

1. **Console logs** are enabled in development
2. **Error handling** with detailed messages
3. **Request logging** with Morgan
4. **Database debugging** with SQL logging

### Client Debugging

1. **React DevTools** for component inspection
2. **React Query DevTools** for API state
3. **Browser DevTools** for network and console
4. **Vite HMR** for fast development

## Deployment

### Production Build

```bash
npm run build             # Build all packages
```

### Environment Setup

1. **Copy environment files** and configure for production
2. **Set NODE_ENV=production**
3. **Configure database** path
4. **Set up file upload** directory
5. **Configure CORS** for production domain

### Deployment Checklist

- [ ] All tests passing
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] File upload directory created
- [ ] CORS configured for production domain
- [ ] Security headers configured
- [ ] Error handling tested

## Troubleshooting

### Common Issues

1. **Build failures**: Check TypeScript errors and dependencies
2. **Test failures**: Ensure all packages are built
3. **CORS errors**: Check CLIENT_URL environment variable
4. **Database errors**: Ensure database file exists and is writable
5. **File upload errors**: Check upload directory permissions

### Getting Help

1. **Check the logs** for detailed error messages
2. **Run tests** to identify specific issues
3. **Verify environment** variables are set correctly
4. **Check dependencies** are installed and up to date

## Contributing

1. **Follow the task-based workflow**
2. **Write comprehensive tests**
3. **Maintain TypeScript strict mode**
4. **Use consistent code style** (ESLint + Prettier)
5. **Update documentation** for new features