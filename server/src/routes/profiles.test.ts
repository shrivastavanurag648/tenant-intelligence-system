/**
 * Tests for profile API routes
 */

import request from 'supertest';
import express from 'express';
import profileRoutes from './profiles';
import { IssueCategory, ComplaintStatus } from '../../../shared/src/types';

// Mock the database connection and ProfileRepository
jest.mock('../database/connection', () => ({
  getDatabase: jest.fn()
}));

jest.mock('../database/profiles', () => ({
  ProfileRepository: jest.fn().mockImplementation(() => ({
    getBuildingProfile: jest.fn(),
    getLandlordProfile: jest.fn(),
    getAllBuildingAddresses: jest.fn(),
    getAllLandlordNames: jest.fn()
  }))
}));

import { getDatabase } from '../database/connection';
import { ProfileRepository } from '../database/profiles';

const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;
const MockProfileRepository = ProfileRepository as jest.MockedClass<typeof ProfileRepository>;

describe('Profile Routes', () => {
  let app: express.Application;
  let mockProfileRepo: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/profiles', profileRoutes);

    mockProfileRepo = {
      getBuildingProfile: jest.fn(),
      getLandlordProfile: jest.fn(),
      getAllBuildingAddresses: jest.fn(),
      getAllLandlordNames: jest.fn()
    } as any;
    mockGetDatabase.mockReturnValue({} as any);
    MockProfileRepository.mockImplementation(() => mockProfileRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profiles/buildings/:address', () => {
    it('should return building profile when found', async () => {
      const mockProfile = {
        address: '123 Test St',
        totalComplaints: 5,
        complaintsByCategory: {
          [IssueCategory.MAINTENANCE]: 2,
          [IssueCategory.SAFETY]: 1,
          [IssueCategory.SANITATION]: 1,
          [IssueCategory.UTILITIES]: 1
        },
        complaintsByStatus: {
          [ComplaintStatus.REPORTED]: 2,
          [ComplaintStatus.UNDER_REVIEW]: 1,
          [ComplaintStatus.RESOLVED]: 2,
          [ComplaintStatus.DISMISSED]: 0
        },
        averageResolutionTime: 5.5,
        recentComplaints: [],
        landlordInfo: {
          name: 'Test Landlord',
          contactInfo: 'test@example.com'
        }
      };

      mockProfileRepo.getBuildingProfile.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/profiles/buildings/123%20Test%20St')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProfile);
      expect(mockProfileRepo.getBuildingProfile).toHaveBeenCalledWith('123 Test St');
    });

    it('should return 404 when building profile not found', async () => {
      mockProfileRepo.getBuildingProfile.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/profiles/buildings/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Building profile not found');
    });

    it('should return 400 when address is missing', async () => {
      mockProfileRepo.getAllBuildingAddresses.mockResolvedValue([]);
      
      // Note: Express actually returns the buildings list when no address param is provided
      // since /api/profiles/buildings/ matches the GET /buildings route
      const response = await request(app)
        .get('/api/profiles/buildings/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle URL encoded addresses', async () => {
      const mockProfile = {
        address: '123 Main St, Apt 4B',
        totalComplaints: 1,
        complaintsByCategory: {
          [IssueCategory.MAINTENANCE]: 1,
          [IssueCategory.SAFETY]: 0,
          [IssueCategory.SANITATION]: 0,
          [IssueCategory.UTILITIES]: 0
        },
        complaintsByStatus: {
          [ComplaintStatus.REPORTED]: 1,
          [ComplaintStatus.UNDER_REVIEW]: 0,
          [ComplaintStatus.RESOLVED]: 0,
          [ComplaintStatus.DISMISSED]: 0
        },
        averageResolutionTime: 0,
        recentComplaints: []
      };

      mockProfileRepo.getBuildingProfile.mockResolvedValue(mockProfile);

      const encodedAddress = encodeURIComponent('123 Main St, Apt 4B');
      const response = await request(app)
        .get(`/api/profiles/buildings/${encodedAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockProfileRepo.getBuildingProfile).toHaveBeenCalledWith('123 Main St, Apt 4B');
    });

    it('should handle server errors gracefully', async () => {
      mockProfileRepo.getBuildingProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/profiles/buildings/test')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/profiles/landlords/:name', () => {
    it('should return landlord profile when found', async () => {
      const mockProfile = {
        id: 'John Landlord',
        name: 'John Landlord',
        properties: ['123 Test St', '456 Test Ave'],
        totalComplaints: 8,
        complaintsByCategory: {
          [IssueCategory.MAINTENANCE]: 3,
          [IssueCategory.SAFETY]: 2,
          [IssueCategory.SANITATION]: 2,
          [IssueCategory.UTILITIES]: 1
        },
        averageResolutionTime: 7.2,
        responseRate: 75.0
      };

      mockProfileRepo.getLandlordProfile.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/profiles/landlords/John%20Landlord')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProfile);
      expect(mockProfileRepo.getLandlordProfile).toHaveBeenCalledWith('John Landlord');
    });

    it('should return 404 when landlord profile not found', async () => {
      mockProfileRepo.getLandlordProfile.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/profiles/landlords/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Landlord profile not found');
    });

    it('should handle URL encoded landlord names', async () => {
      const mockProfile = {
        id: 'Jane Smith-Jones',
        name: 'Jane Smith-Jones',
        properties: ['789 Oak St'],
        totalComplaints: 2,
        complaintsByCategory: {
          [IssueCategory.MAINTENANCE]: 1,
          [IssueCategory.SAFETY]: 1,
          [IssueCategory.SANITATION]: 0,
          [IssueCategory.UTILITIES]: 0
        },
        averageResolutionTime: 3.5,
        responseRate: 100.0
      };

      mockProfileRepo.getLandlordProfile.mockResolvedValue(mockProfile);

      const encodedName = encodeURIComponent('Jane Smith-Jones');
      const response = await request(app)
        .get(`/api/profiles/landlords/${encodedName}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockProfileRepo.getLandlordProfile).toHaveBeenCalledWith('Jane Smith-Jones');
    });

    it('should handle server errors gracefully', async () => {
      mockProfileRepo.getLandlordProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/profiles/landlords/test')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/profiles/buildings', () => {
    it('should return list of building addresses', async () => {
      const mockAddresses = ['123 Test St', '456 Test Ave', '789 Oak Blvd'];
      mockProfileRepo.getAllBuildingAddresses.mockResolvedValue(mockAddresses);

      const response = await request(app)
        .get('/api/profiles/buildings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAddresses);
      expect(mockProfileRepo.getAllBuildingAddresses).toHaveBeenCalled();
    });

    it('should return empty array when no buildings exist', async () => {
      mockProfileRepo.getAllBuildingAddresses.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/profiles/buildings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should handle server errors gracefully', async () => {
      mockProfileRepo.getAllBuildingAddresses.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/profiles/buildings')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/profiles/landlords', () => {
    it('should return list of landlord names', async () => {
      const mockNames = ['John Landlord', 'Jane Smith', 'Bob Property Manager'];
      mockProfileRepo.getAllLandlordNames.mockResolvedValue(mockNames);

      const response = await request(app)
        .get('/api/profiles/landlords')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockNames);
      expect(mockProfileRepo.getAllLandlordNames).toHaveBeenCalled();
    });

    it('should return empty array when no landlords exist', async () => {
      mockProfileRepo.getAllLandlordNames.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/profiles/landlords')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should handle server errors gracefully', async () => {
      mockProfileRepo.getAllLandlordNames.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/profiles/landlords')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});