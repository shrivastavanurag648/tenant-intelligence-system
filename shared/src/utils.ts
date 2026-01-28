/**
 * Utility functions for the Tenant Intelligence System
 */

import { IssueCategory, ComplaintStatus, ClassificationResult } from './types';
import { CATEGORY_KEYWORDS, MIN_CLASSIFICATION_CONFIDENCE, VALID_STATUS_TRANSITIONS } from './constants';

/**
 * Generate a random UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Simple text-based classification using keyword matching
 */
export function classifyComplaint(text: string): ClassificationResult {
  const normalizedText = text.toLowerCase();
  const scores: Record<IssueCategory, number> = {
    [IssueCategory.SAFETY]: 0,
    [IssueCategory.MAINTENANCE]: 0,
    [IssueCategory.SANITATION]: 0,
    [IssueCategory.UTILITIES]: 0,
  };

  // Count keyword matches for each category
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (normalizedText.includes(keyword.toLowerCase())) {
        scores[category as IssueCategory] += 1;
      }
    });
  });

  // Find the category with the highest score
  const sortedCategories = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([category]) => category as IssueCategory);

  const topCategory = sortedCategories[0];
  const topScore = scores[topCategory];
  const totalWords = normalizedText.split(/\s+/).length;
  
  // Calculate confidence based on keyword density
  const confidence = Math.min(topScore / Math.max(totalWords * 0.1, 1), 1);

  return {
    category: topCategory,
    confidence,
    suggestedCategories: sortedCategories.slice(0, 3), // Top 3 suggestions
  };
}

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from: ComplaintStatus, to: ComplaintStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return formatDate(date);
}

/**
 * Calculate average resolution time in hours
 */
export function calculateAverageResolutionTime(complaints: Array<{
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
}>): number {
  const resolvedComplaints = complaints.filter(c => c.status === ComplaintStatus.RESOLVED);
  
  if (resolvedComplaints.length === 0) return 0;

  const totalHours = resolvedComplaints.reduce((sum, complaint) => {
    const resolutionTime = complaint.updatedAt.getTime() - complaint.createdAt.getTime();
    return sum + (resolutionTime / (1000 * 60 * 60)); // Convert to hours
  }, 0);

  return totalHours / resolvedComplaints.length;
}

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be smaller than 5MB' };
  }

  return { valid: true };
}

/**
 * Generate a safe filename for uploaded images
 */
export function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `${timestamp}-${randomId}.${extension}`;
}

/**
 * Calculate percentage with safe division
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Check if classification confidence is high enough for auto-assignment
 */
export function isHighConfidenceClassification(confidence: number): boolean {
  return confidence >= MIN_CLASSIFICATION_CONFIDENCE;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create a URL-safe slug from text
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}