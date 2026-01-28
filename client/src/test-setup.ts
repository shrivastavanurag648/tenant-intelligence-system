/**
 * Test setup for client package
 */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Global test configuration
global.console = {
  ...console,
  // Allow console.log in client tests for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';

// Setup fast-check for property-based testing
import fc from 'fast-check';

// Configure fast-check for consistent test runs
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations as specified in design
  seed: 42, // Fixed seed for reproducible tests
  verbose: false,
});

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;