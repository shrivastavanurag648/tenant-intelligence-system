/**
 * Test setup for shared package
 */

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

// Setup fast-check for property-based testing
import fc from 'fast-check';

// Configure fast-check for consistent test runs
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations as specified in design
  seed: 42, // Fixed seed for reproducible tests
  verbose: false,
});