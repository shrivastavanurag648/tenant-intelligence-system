/**
 * Basic unit tests for shared types and utilities
 */

import { IssueCategory, ComplaintStatus } from './types';
import { classifyComplaint, generateId, isValidStatusTransition } from './utils';

describe('Types and Enums', () => {
  test('IssueCategory enum has correct values', () => {
    expect(IssueCategory.SAFETY).toBe('Safety');
    expect(IssueCategory.MAINTENANCE).toBe('Maintenance');
    expect(IssueCategory.SANITATION).toBe('Sanitation');
    expect(IssueCategory.UTILITIES).toBe('Utilities');
  });

  test('ComplaintStatus enum has correct values', () => {
    expect(ComplaintStatus.REPORTED).toBe('Reported');
    expect(ComplaintStatus.UNDER_REVIEW).toBe('Under Review');
    expect(ComplaintStatus.RESOLVED).toBe('Resolved');
    expect(ComplaintStatus.DISMISSED).toBe('Dismissed');
  });
});

describe('Utility Functions', () => {
  test('generateId creates valid UUID format', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('classifyComplaint returns valid classification', () => {
    const result = classifyComplaint('The heating system is broken and not working');
    expect(Object.values(IssueCategory)).toContain(result.category);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.suggestedCategories).toHaveLength(3);
  });

  test('isValidStatusTransition validates transitions correctly', () => {
    expect(isValidStatusTransition(ComplaintStatus.REPORTED, ComplaintStatus.UNDER_REVIEW)).toBe(true);
    expect(isValidStatusTransition(ComplaintStatus.RESOLVED, ComplaintStatus.REPORTED)).toBe(false);
  });
});