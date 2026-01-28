/**
 * Unit tests for complaint submission API endpoint
 */

import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../index';
import { getDatabase, initializeDatabase, closeDatabase } from '../database/connection';
import { IssueCategory, ComplaintStatus } from '../../../shared/src/types';

describe('Complaint API Endpoints', () => {
  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase();
  });

  afterAll(async () => {
    // Clean up database
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear complaints table before each test
    const db = getDatabase();
    await db.run('DELETE FROM complaints');
    await db.run('DELETE FROM evidence');
    await db.run('DELETE FROM status_history');
  });

  describe('POST /api/complaints', () => {
    it('should create a complaint with valid data', async () => {
      const complaintData = {
        buildingAddress: '123 Main St, Anytown, ST 12345',
        description: 'The heating system has been broken for over a week. The temperature in my apartment is consistently below 60°F.',
        category: IssueCategory.UTILITIES,
        landlordInfo: {
          name: 'John Smith',
          contactInfo: 'john@example.com'
        }
      };

      const response = await request(app)
        .post('/api/complaints')
        .field('complaint', JSON.stringify(complaintData))
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        buildingAddress: complaintData.buildingAddress,
        description: complaintData.description,
        category: complaintData.category,
        status: ComplaintStatus.REPORTED,
        upvotes: 0
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should create a complaint with image upload', async () => {
      const complaintData = {
        buildingAddress: '456 Oak Ave, Somewhere, ST 67890',
        description: 'Water damage in the bathroom ceiling with visible mold growth.',
        category: IssueCategory.SANITATION
      };

      // Create a minimal test buffer with proper JPEG magic bytes
      const testBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);

      const response = await request(app)
        .post('/api/complaints')
        .field('complaint', JSON.stringify(complaintData))
        .attach('image', testBuffer, { 
          filename: 'test-image.jpg',
          contentType: 'image/jpeg'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imageUrl).toBeDefined();
      expect(response.body.data.imageUrl).toMatch(/^\/uploads\//);
    });

    it('should reject complaint with missing required fields', async () => {
      const invalidData = {
        buildingAddress: '123 Main St',
        // Missing description
        category: IssueCategory.MAINTENANCE
      };

      const response = await request(app)
        .post('/api/complaints')
        .field('complaint', JSON.stringify(invalidData))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should reject complaint with invalid building address', async () => {
      const invalidData = {
        buildingAddress: '123', // Too short
        description: 'This is a valid description that meets the minimum length requirement.',
        category: IssueCategory.MAINTENANCE
      };

      const response = await request(app)
        .post('/api/complaints')
        .field('complaint', JSON.stringify(invalidData))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should reject complaint with invalid description', async () => {
      const invalidData = {
        buildingAddress: '123 Main St, Anytown, ST 12345',
        description: 'Short', // Too short
        category: IssueCategory.MAINTENANCE
      };

      const response = await request(app)
        .post('/api/complaints')
        .field('complaint', JSON.stringify(invalidData))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should sanitize input data', async () => {
      const complaintData = {
        buildingAddress: '  123 Main St, Anytown, ST 12345  ',
        description: '  This description has extra whitespace that should be trimmed.  ',
        category: IssueCategory.SAFETY,
        landlordInfo: {
          name: '  Jane Doe  ',
          contactInfo: '  jane@example.com  '
        }
      };

      const response = await request(app)
        .post('/api/complaints')
        .field('complaint', JSON.stringify(complaintData))
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.buildingAddress).toBe('123 Main St, Anytown, ST 12345');
      expect(response.body.data.description).toBe('This description has extra whitespace that should be trimmed.');
    });
  });

  describe('GET /api/complaints', () => {
    beforeEach(async () => {
      // Create test complaints
      const db = getDatabase();
      const testComplaints = [
        {
          id: 'e5f6a7b8-c9d0-1234-ef56-789012345678',
          building_address: '123 Main St',
          description: 'Test complaint 1',
          category: IssueCategory.MAINTENANCE,
          status: ComplaintStatus.REPORTED,
          upvotes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'f6a7b8c9-d0e1-2345-f678-90123456789a',
          building_address: '456 Oak Ave',
          description: 'Test complaint 2',
          category: IssueCategory.SAFETY,
          status: ComplaintStatus.UNDER_REVIEW,
          upvotes: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      for (const complaint of testComplaints) {
        await db.run(`
          INSERT INTO complaints (
            id, building_address, description, category, status, 
            upvotes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          complaint.id,
          complaint.building_address,
          complaint.description,
          complaint.category,
          complaint.status,
          complaint.upvotes,
          complaint.created_at,
          complaint.updated_at
        ]);
      }
    });

    it('should return all complaints', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter complaints by category', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .query({ category: IssueCategory.SAFETY })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].category).toBe(IssueCategory.SAFETY);
    });

    it('should filter complaints by building address', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .query({ buildingAddress: 'Main' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].buildingAddress).toContain('Main');
    });
  });

  describe('GET /api/complaints/:id', () => {
    let testComplaintId: string;

    beforeEach(async () => {
      const db = getDatabase();
      testComplaintId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // Valid UUID format
      
      await db.run(`
        INSERT INTO complaints (
          id, building_address, description, category, status, 
          upvotes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testComplaintId,
        '123 Test St',
        'Test complaint description',
        IssueCategory.MAINTENANCE,
        ComplaintStatus.REPORTED,
        0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    });

    it('should return a specific complaint', async () => {
      const response = await request(app)
        .get(`/api/complaints/${testComplaintId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testComplaintId);
      expect(response.body.data.buildingAddress).toBe('123 Test St');
    });

    it('should return 404 for non-existent complaint', async () => {
      const response = await request(app)
        .get('/api/complaints/b2c3d4e5-f6a7-8901-bcde-f23456789012') // Valid UUID format
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 for invalid complaint ID format', async () => {
      const response = await request(app)
        .get('/api/complaints/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/complaints/:id/upvote', () => {
    let testComplaintId: string;

    beforeEach(async () => {
      const db = getDatabase();
      testComplaintId = 'c3d4e5f6-a7b8-9012-cdef-345678901234'; // Valid UUID format
      
      await db.run(`
        INSERT INTO complaints (
          id, building_address, description, category, status, 
          upvotes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testComplaintId,
        '123 Upvote St',
        'Test complaint for upvoting',
        IssueCategory.UTILITIES,
        ComplaintStatus.REPORTED,
        0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    });

    it('should add an upvote to a complaint', async () => {
      const response = await request(app)
        .post(`/api/complaints/${testComplaintId}/upvote`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.upvotes).toBe(1);
    });

    it('should return 404 for non-existent complaint', async () => {
      const response = await request(app)
        .post('/api/complaints/d4e5f6a7-b8c9-0123-def4-56789012345a/upvote') // Valid UUID format
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('GET /api/complaints/:id/image', () => {
    let testComplaintId: string;

    beforeEach(async () => {
      const db = getDatabase();
      testComplaintId = 'e6f7a8b9-c0d1-2345-ef67-890123456789';
      
      await db.run(`
        INSERT INTO complaints (
          id, building_address, description, category, status, 
          image_url, upvotes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testComplaintId,
        '123 Image Test St',
        'Test complaint with image',
        IssueCategory.MAINTENANCE,
        ComplaintStatus.REPORTED,
        '/uploads/test-image.jpg',
        0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    });

    it('should return 404 for complaint without image', async () => {
      // Create complaint without image
      const db = getDatabase();
      const noImageId = 'f7a8b9c0-d1e2-3456-f789-01234567890a';
      
      await db.run(`
        INSERT INTO complaints (
          id, building_address, description, category, status, 
          upvotes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        noImageId,
        '456 No Image St',
        'Test complaint without image',
        IssueCategory.SAFETY,
        ComplaintStatus.REPORTED,
        0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      const response = await request(app)
        .get(`/api/complaints/${noImageId}/image`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('No image found for this complaint');
    });

    it('should return 404 for non-existent complaint', async () => {
      const response = await request(app)
        .get('/api/complaints/a8b9c0d1-e2f3-4567-a890-123456789012/image')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Complaint not found');
    });
  });

  describe('PUT /api/complaints/:id/status', () => {
    let testComplaintId: string;

    beforeEach(async () => {
      const db = getDatabase();
      testComplaintId = 'a8b9c0d1-e2f3-4567-8901-234567890abc';
      
      await db.run(`
        INSERT INTO complaints (
          id, building_address, description, category, status, 
          upvotes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testComplaintId,
        '123 Status Test St',
        'Test complaint for status updates',
        IssueCategory.MAINTENANCE,
        ComplaintStatus.REPORTED,
        0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    });

    it('should update complaint status', async () => {
      const statusUpdate = {
        newStatus: ComplaintStatus.UNDER_REVIEW,
        notes: 'Investigation started'
      };

      const response = await request(app)
        .put(`/api/complaints/${testComplaintId}/status`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ComplaintStatus.UNDER_REVIEW);
      expect(response.body.message).toBe('Status updated successfully');
    });

    it('should update complaint status without notes', async () => {
      const statusUpdate = {
        newStatus: ComplaintStatus.RESOLVED
      };

      const response = await request(app)
        .put(`/api/complaints/${testComplaintId}/status`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ComplaintStatus.RESOLVED);
    });

    it('should return 404 for non-existent complaint', async () => {
      const statusUpdate = {
        newStatus: ComplaintStatus.UNDER_REVIEW
      };

      const response = await request(app)
        .put('/api/complaints/b9c0d1e2-f3a4-5678-9012-345678901bcd/status')
        .send(statusUpdate)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 for invalid status', async () => {
      const statusUpdate = {
        newStatus: 'Invalid Status'
      };

      const response = await request(app)
        .put(`/api/complaints/${testComplaintId}/status`)
        .send(statusUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 400 for invalid complaint ID format', async () => {
      const statusUpdate = {
        newStatus: ComplaintStatus.RESOLVED
      };

      const response = await request(app)
        .put('/api/complaints/invalid-uuid/status')
        .send(statusUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/complaints/:id/status-history', () => {
    let testComplaintId: string;

    beforeEach(async () => {
      const db = getDatabase();
      testComplaintId = 'c9d0e1f2-a3b4-5678-9012-3456789012de';
      
      // Create complaint
      await db.run(`
        INSERT INTO complaints (
          id, building_address, description, category, status, 
          upvotes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testComplaintId,
        '123 History Test St',
        'Test complaint for status history',
        IssueCategory.SAFETY,
        ComplaintStatus.UNDER_REVIEW,
        0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      // Add some status history entries
      await db.run(`
        INSERT INTO status_history (
          id, complaint_id, old_status, new_status, notes, changed_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'hist1',
        testComplaintId,
        null,
        ComplaintStatus.REPORTED,
        null,
        new Date(new Date().getTime() - 86400000).toISOString() // 1 day ago
      ]);

      await db.run(`
        INSERT INTO status_history (
          id, complaint_id, old_status, new_status, notes, changed_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'hist2',
        testComplaintId,
        ComplaintStatus.REPORTED,
        ComplaintStatus.UNDER_REVIEW,
        'Investigation started',
        new Date().toISOString()
      ]);
    });

    it('should return status history for a complaint', async () => {
      const response = await request(app)
        .get(`/api/complaints/${testComplaintId}/status-history`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Find the entries we created manually
      const reportedEntry = response.body.data.find((entry: any) => entry.id === 'hist1');
      const underReviewEntry = response.body.data.find((entry: any) => entry.id === 'hist2');
      
      expect(reportedEntry.newStatus).toBe(ComplaintStatus.REPORTED);
      expect(underReviewEntry.newStatus).toBe(ComplaintStatus.UNDER_REVIEW);
      expect(underReviewEntry.notes).toBe('Investigation started');
    });

    it('should return 404 for non-existent complaint', async () => {
      const response = await request(app)
        .get('/api/complaints/d0e1f2a3-b4c5-6789-0123-456789012ef0/status-history')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 for invalid complaint ID format', async () => {
      const response = await request(app)
        .get('/api/complaints/invalid-uuid/status-history')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });
});