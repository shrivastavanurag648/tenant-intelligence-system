/**
 * Evidence API routes tests
 */

import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../index';
import { initializeDatabase, getDatabase, closeDatabase } from '../database/connection';
import { ComplaintRepository } from '../database/complaints';
import { EvidenceRepository } from '../database/evidence';
import { IssueCategory } from '../../../shared/src/types';

describe('Evidence API Routes', () => {
  let complaintId: string;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create a test complaint for evidence submission
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    const complaint = await complaintRepo.create({
      buildingAddress: '123 Test Street, Test City',
      description: 'Test complaint for evidence submission',
      category: IssueCategory.MAINTENANCE
    });
    
    complaintId = complaint.id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/evidence/:complaintId', () => {
    it('should submit evidence with text only', async () => {
      const evidenceData = {
        description: 'I have the same issue in my apartment'
      };

      const response = await request(app)
        .post(`/api/evidence/${complaintId}`)
        .send({ description: evidenceData.description })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        complaintId,
        description: evidenceData.description
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should submit evidence with text and image', async () => {
      const evidenceData = {
        description: 'Photo evidence of the same problem'
      };

      const testImagePath = path.join(__dirname, '../../../test-fixtures/test-image.jpg');
      
      const response = await request(app)
        .post(`/api/evidence/${complaintId}`)
        .field('description', evidenceData.description)
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        complaintId,
        description: evidenceData.description
      });
      expect(response.body.data.imageUrl).toMatch(/\/uploads\/evidence\/.+/);
    });

    it('should reject evidence for non-existent complaint', async () => {
      const fakeComplaintId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .post(`/api/evidence/${fakeComplaintId}`)
        .send({ description: 'Evidence for non-existent complaint' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should reject evidence with empty description', async () => {
      const response = await request(app)
        .post(`/api/evidence/${complaintId}`)
        .send({ description: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should reject evidence with invalid image format', async () => {
      // Create a fake text file with .txt extension
      const fakeImagePath = path.join(__dirname, '../../../test-fixtures/fake-image.txt');
      await fs.writeFile(fakeImagePath, 'This is not an image');

      const response = await request(app)
        .post(`/api/evidence/${complaintId}`)
        .field('description', 'Evidence with invalid image')
        .attach('image', fakeImagePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Upload Error');

      // Clean up fake file
      await fs.unlink(fakeImagePath).catch(() => {});
    });
  });

  describe('GET /api/evidence/:complaintId', () => {
    it('should get all evidence for a complaint', async () => {
      const response = await request(app)
        .get(`/api/evidence/${complaintId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check that evidence has required fields
      const evidence = response.body.data[0];
      expect(evidence).toHaveProperty('id');
      expect(evidence).toHaveProperty('complaintId', complaintId);
      expect(evidence).toHaveProperty('description');
      expect(evidence).toHaveProperty('createdAt');
    });

    it('should return empty array for complaint with no evidence', async () => {
      // Create another complaint without evidence
      const db = getDatabase();
      const complaintRepo = new ComplaintRepository(db);
      
      const newComplaint = await complaintRepo.create({
        buildingAddress: '456 Empty Street, Test City',
        description: 'Complaint with no evidence',
        category: IssueCategory.SAFETY
      });

      const response = await request(app)
        .get(`/api/evidence/${newComplaint.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return 404 for non-existent complaint', async () => {
      const fakeComplaintId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/evidence/${fakeComplaintId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('Evidence in complaint responses', () => {
    it('should include evidence when fetching complaint details', async () => {
      const response = await request(app)
        .get(`/api/complaints/${complaintId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.evidence).toBeDefined();
      expect(Array.isArray(response.body.data.evidence)).toBe(true);
      expect(response.body.data.evidence.length).toBeGreaterThan(0);
    });
  });
});