/**
 * Application constants for the Tenant Intelligence System
 */

import { IssueCategory, ComplaintStatus } from './types';

// File upload limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

// Text limits
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MIN_EVIDENCE_DESCRIPTION_LENGTH = 5;
export const MAX_EVIDENCE_DESCRIPTION_LENGTH = 1000;
export const MIN_ADDRESS_LENGTH = 5;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_LANDLORD_NAME_LENGTH = 100;
export const MAX_LANDLORD_CONTACT_LENGTH = 200;
export const MAX_STATUS_NOTES_LENGTH = 500;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Classification confidence thresholds
export const MIN_CLASSIFICATION_CONFIDENCE = 0.7;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;

// Status transition rules
export const VALID_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.REPORTED]: [ComplaintStatus.UNDER_REVIEW, ComplaintStatus.DISMISSED],
  [ComplaintStatus.UNDER_REVIEW]: [ComplaintStatus.RESOLVED, ComplaintStatus.DISMISSED, ComplaintStatus.REPORTED],
  [ComplaintStatus.RESOLVED]: [ComplaintStatus.UNDER_REVIEW], // Allow reopening
  [ComplaintStatus.DISMISSED]: [ComplaintStatus.UNDER_REVIEW], // Allow reconsideration
};

// Issue category keywords for simple classification
export const CATEGORY_KEYWORDS: Record<IssueCategory, string[]> = {
  [IssueCategory.SAFETY]: [
    'unsafe', 'danger', 'hazard', 'fire', 'smoke', 'carbon monoxide', 'gas leak',
    'electrical', 'wiring', 'broken glass', 'sharp', 'injury', 'accident',
    'security', 'lock', 'door', 'window', 'break-in', 'theft', 'violence',
    'stairs', 'railing', 'fall', 'slip', 'trip', 'emergency', 'poison',
    'asbestos', 'lead paint', 'structural damage', 'collapse'
  ],
  [IssueCategory.MAINTENANCE]: [
    'repair', 'broken', 'fix', 'maintenance', 'damage', 'worn', 'replace',
    'paint', 'wall', 'ceiling', 'floor', 'door', 'window', 'roof', 'leak',
    'crack', 'hole', 'dent', 'scratch', 'appliance', 'hvac', 'heating',
    'cooling', 'air conditioning', 'furnace', 'boiler', 'radiator',
    'cabinet', 'counter', 'fixture', 'hardware', 'handle', 'knob'
  ],
  [IssueCategory.SANITATION]: [
    'dirty', 'clean', 'sanitation', 'hygiene', 'garbage', 'trash', 'waste',
    'smell', 'odor', 'stink', 'mold', 'mildew', 'fungus', 'bacteria',
    'pest', 'bug', 'insect', 'rodent', 'mouse', 'rat', 'cockroach',
    'ant', 'spider', 'flea', 'bed bug', 'termite', 'infestation',
    'sewage', 'drain', 'clog', 'backup', 'overflow', 'toilet', 'bathroom',
    'kitchen', 'sink', 'dishwasher', 'washing machine'
  ],
  [IssueCategory.UTILITIES]: [
    'electricity', 'power', 'electric', 'outlet', 'switch', 'light',
    'water', 'plumbing', 'pipe', 'faucet', 'shower', 'bath', 'hot water',
    'cold water', 'pressure', 'flow', 'gas', 'heating', 'cooling',
    'internet', 'wifi', 'cable', 'phone', 'utility', 'bill', 'meter',
    'outage', 'blackout', 'brownout', 'surge', 'circuit breaker',
    'no power', 'no water', 'no heat', 'no air conditioning'
  ]
};

// Default category counts for new profiles
export const EMPTY_CATEGORY_COUNTS: Record<IssueCategory, number> = {
  [IssueCategory.SAFETY]: 0,
  [IssueCategory.MAINTENANCE]: 0,
  [IssueCategory.SANITATION]: 0,
  [IssueCategory.UTILITIES]: 0,
};

export const EMPTY_STATUS_COUNTS: Record<ComplaintStatus, number> = {
  [ComplaintStatus.REPORTED]: 0,
  [ComplaintStatus.UNDER_REVIEW]: 0,
  [ComplaintStatus.RESOLVED]: 0,
  [ComplaintStatus.DISMISSED]: 0,
};

// API endpoints
export const API_ENDPOINTS = {
  COMPLAINTS: '/api/complaints',
  EVIDENCE: '/api/evidence',
  BUILDINGS: '/api/buildings',
  LANDLORDS: '/api/landlords',
  STATISTICS: '/api/statistics',
  UPLOAD: '/api/upload',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Only JPEG, PNG, and WebP images are allowed',
  FILE_TOO_LARGE: 'Image must be smaller than 5MB',
  DESCRIPTION_TOO_SHORT: 'Description must be at least 10 characters',
  DESCRIPTION_TOO_LONG: 'Description must be less than 2000 characters',
  ADDRESS_TOO_SHORT: 'Building address must be at least 5 characters',
  ADDRESS_TOO_LONG: 'Building address must be less than 200 characters',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  COMPLAINT_NOT_FOUND: 'Complaint not found',
  BUILDING_NOT_FOUND: 'Building not found',
  LANDLORD_NOT_FOUND: 'Landlord not found',
  CLASSIFICATION_FAILED: 'Failed to classify complaint',
  UPLOAD_FAILED: 'Failed to upload image',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INTERNAL_ERROR: 'Internal server error',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  COMPLAINT_SUBMITTED: 'Complaint submitted successfully',
  COMPLAINT_UPDATED: 'Complaint updated successfully',
  EVIDENCE_ADDED: 'Evidence added successfully',
  UPVOTE_ADDED: 'Upvote added successfully',
  STATUS_UPDATED: 'Status updated successfully',
  IMAGE_UPLOADED: 'Image uploaded successfully',
} as const;