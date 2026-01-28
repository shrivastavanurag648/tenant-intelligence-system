/**
 * Core data types for the Tenant Intelligence System
 */

export enum IssueCategory {
  SAFETY = 'Safety',
  MAINTENANCE = 'Maintenance',
  SANITATION = 'Sanitation',
  UTILITIES = 'Utilities'
}

export enum ComplaintStatus {
  REPORTED = 'Reported',
  UNDER_REVIEW = 'Under Review',
  RESOLVED = 'Resolved',
  DISMISSED = 'Dismissed'
}

export interface Complaint {
  id: string;
  buildingAddress: string;
  description: string;
  category: IssueCategory;
  status: ComplaintStatus;
  imageUrl?: string;
  upvotes: number;
  evidence: Evidence[];
  createdAt: Date;
  updatedAt: Date;
  landlordInfo?: {
    name: string;
    contactInfo?: string;
  };
  // AI Classification fields
  aiCategory?: IssueCategory;
  aiConfidence?: number;
  userConfirmedCategory?: boolean;
}

export interface Evidence {
  id: string;
  complaintId: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface BuildingProfile {
  address: string;
  totalComplaints: number;
  complaintsByCategory: Record<IssueCategory, number>;
  complaintsByStatus: Record<ComplaintStatus, number>;
  averageResolutionTime: number;
  recentComplaints: Complaint[];
  landlordInfo?: LandlordInfo;
}

export interface LandlordProfile {
  id: string;
  name: string;
  properties: string[];
  totalComplaints: number;
  complaintsByCategory: Record<IssueCategory, number>;
  averageResolutionTime: number;
  responseRate: number;
}

export interface LandlordInfo {
  name: string;
  contactInfo?: string;
}

export interface ClassificationResult {
  category: IssueCategory;
  confidence: number;
  suggestedCategories: IssueCategory[];
}

export interface ComplaintSubmission {
  buildingAddress: string;
  description: string;
  category?: IssueCategory;
  imageFile?: File;
  landlordInfo?: {
    name: string;
    contactInfo?: string;
  };
}

export interface ComplaintResponse {
  id: string;
  buildingAddress: string;
  description: string;
  category: IssueCategory;
  status: ComplaintStatus;
  imageUrl?: string;
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
  classification?: ClassificationResult;
}

export interface ComplaintFilters {
  buildingAddress?: string;
  category?: IssueCategory;
  status?: ComplaintStatus;
  landlordName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface StatisticsFilters {
  buildingAddress?: string;
  landlordName?: string;
  category?: IssueCategory;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface Statistics {
  totalComplaints: number;
  complaintsByCategory: Record<IssueCategory, number>;
  complaintsByStatus: Record<ComplaintStatus, number>;
  averageResolutionTime: number;
  mostCommonIssues: Array<{
    category: IssueCategory;
    count: number;
    percentage: number;
  }>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TrendData {
  period: string;
  complaints: number;
  resolved: number;
  categories: Record<IssueCategory, number>;
}

export interface TrainingExample {
  text: string;
  category: IssueCategory;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Status update types
export interface StatusUpdate {
  complaintId: string;
  newStatus: ComplaintStatus;
  notes?: string;
}

export interface StatusHistory {
  id: string;
  complaintId: string;
  oldStatus?: ComplaintStatus;
  newStatus: ComplaintStatus;
  notes?: string;
  changedAt: Date;
}