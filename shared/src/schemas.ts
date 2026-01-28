/**
 * Zod validation schemas for the Tenant Intelligence System
 */

import { z } from 'zod';
import { IssueCategory, ComplaintStatus } from './types';

// Enum schemas
export const IssueCategorySchema = z.nativeEnum(IssueCategory);
export const ComplaintStatusSchema = z.nativeEnum(ComplaintStatus);

// Core entity schemas
export const LandlordInfoSchema = z.object({
  name: z.string().min(1, 'Landlord name is required').max(100),
  contactInfo: z.string().max(200).optional(),
});

export const ComplaintSubmissionSchema = z.object({
  buildingAddress: z.string().min(5, 'Building address must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: IssueCategorySchema.optional(),
  landlordInfo: LandlordInfoSchema.optional(),
});

export const EvidenceSubmissionSchema = z.object({
  complaintId: z.string().uuid('Invalid complaint ID'),
  description: z.string().min(5, 'Evidence description must be at least 5 characters').max(1000),
});

export const StatusUpdateSchema = z.object({
  complaintId: z.string().uuid('Invalid complaint ID'),
  newStatus: ComplaintStatusSchema,
  notes: z.string().max(500).optional(),
});

export const ComplaintFiltersSchema = z.object({
  buildingAddress: z.string().optional(),
  category: IssueCategorySchema.optional(),
  status: ComplaintStatusSchema.optional(),
  landlordName: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const StatisticsFiltersSchema = z.object({
  buildingAddress: z.string().optional(),
  landlordName: z.string().optional(),
  category: IssueCategorySchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// File upload validation
export const ImageFileSchema = z.object({
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, and WebP images are allowed' }),
  }),
  size: z.number().max(5 * 1024 * 1024, 'Image must be smaller than 5MB'),
});

// API parameter schemas
export const ComplaintIdParamSchema = z.object({
  id: z.string().uuid('Invalid complaint ID'),
});

export const BuildingAddressParamSchema = z.object({
  address: z.string().min(1, 'Building address is required'),
});

export const LandlordIdParamSchema = z.object({
  landlordId: z.string().min(1, 'Landlord ID is required'),
});

// Response validation schemas
export const ComplaintSchema = z.object({
  id: z.string().uuid(),
  buildingAddress: z.string(),
  description: z.string(),
  category: IssueCategorySchema,
  status: ComplaintStatusSchema,
  imageUrl: z.string().url().optional(),
  upvotes: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  landlordInfo: LandlordInfoSchema.optional(),
});

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  complaintId: z.string().uuid(),
  description: z.string(),
  imageUrl: z.string().url().optional(),
  createdAt: z.date(),
});

export const ClassificationResultSchema = z.object({
  category: IssueCategorySchema,
  confidence: z.number().min(0).max(1),
  suggestedCategories: z.array(IssueCategorySchema),
});

export const BuildingProfileSchema = z.object({
  address: z.string(),
  totalComplaints: z.number().int().min(0),
  complaintsByCategory: z.record(IssueCategorySchema, z.number().int().min(0)),
  complaintsByStatus: z.record(ComplaintStatusSchema, z.number().int().min(0)),
  averageResolutionTime: z.number().min(0),
  recentComplaints: z.array(ComplaintSchema),
  landlordInfo: LandlordInfoSchema.optional(),
});

export const LandlordProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  properties: z.array(z.string()),
  totalComplaints: z.number().int().min(0),
  complaintsByCategory: z.record(IssueCategorySchema, z.number().int().min(0)),
  averageResolutionTime: z.number().min(0),
  responseRate: z.number().min(0).max(1),
});

// Utility function to validate and parse data
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
}

// Type inference helpers
export type ComplaintSubmissionInput = z.infer<typeof ComplaintSubmissionSchema>;
export type EvidenceSubmissionInput = z.infer<typeof EvidenceSubmissionSchema>;
export type StatusUpdateInput = z.infer<typeof StatusUpdateSchema>;
export type ComplaintFiltersInput = z.infer<typeof ComplaintFiltersSchema>;
export type StatisticsFiltersInput = z.infer<typeof StatisticsFiltersSchema>;