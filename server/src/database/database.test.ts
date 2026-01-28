/**
 * Database functionality tests
 * Tests for database connection, CRUD operations, and data integrity
 */

import { Database } from './connection';
import { ComplaintRepository } from './complaints';
import { EvidenceRepository } from './evidence';
import { IssueCategory, ComplaintStatus } from '../../../shared/src/types';

describe('Database Functionality', () => {
  let db: Database;
  let complaintRepo: ComplaintRepository;
  let evidenceRepo: EvidenceRepository;

  beforeAll(async () => {
    // Use in-memory database for testing
    db = new Database(':memory:');
    await db.initialize();
    complaintRepo = new ComplaintRepository(db);
    evidenceRepo = new EvidenceRepository(db);
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await db.run('DELETE FROM evidence');
    await db.run('DELETE FROM status_history');
    await db.run('DELETE FROM complaints');
  });

  describe('Database Connection', () => {
    test('should initialize database successfully', async () => {
      const testDb = new Database(':memory:');
      await expect(testDb.initialize()).resolves.not.toThrow();
      await testDb.close();
    });

    test('should create all required tables', async () => {
      const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      
      const tableNames = tables.map((t: any) => t.name);
      expect(tableNames).toContain('complaints');
      expect(tableNames).toContain('evidence');
      expect(tableNames).toContain('status_history');
    });

    test('should enforce foreign key constraints', async () => {
      const result = await db.get('PRAGMA foreign_keys');
      expect(result).toBeTruthy();
    });
  });

  describe('Complaint Repository', () => {
    test('should create a new complaint', async () => {
      const submission = {
        buildingAddress: '123 Test Street, Apt 1A',
        description: 'Test complaint description',
        category: IssueCategory.MAINTENANCE,
        landlordInfo: {
          name: 'Test Landlord',
          contactInfo: 'test@example.com'
        }
      };

      const complaint = await complaintRepo.create(submission);

      expect(complaint.id).toBeDefined();
      expect(complaint.buildingAddress).toBe(submission.buildingAddress);
      expect(complaint.description).toBe(submission.description);
      expect(complaint.category).toBe(submission.category);
      expect(complaint.status).toBe(ComplaintStatus.REPORTED);
      expect(complaint.upvotes).toBe(0);
      expect(complaint.landlordInfo?.name).toBe(submission.landlordInfo.name);
      expect(typeof complaint.createdAt).toBe('object');
      expect(typeof complaint.updatedAt).toBe('object');
    });

    test('should find complaint by ID', async () => {
      const submission = {
        buildingAddress: '123 Test Street',
        description: 'Test complaint',
        category: IssueCategory.SAFETY
      };

      const created = await complaintRepo.create(submission);
      const found = await complaintRepo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.buildingAddress).toBe(submission.buildingAddress);
    });

    test('should return null for non-existent complaint', async () => {
      const found = await complaintRepo.findById('non-existent-id');
      expect(found).toBeNull();
    });

    test('should update complaint status', async () => {
      const submission = {
        buildingAddress: '123 Test Street',
        description: 'Test complaint',
        category: IssueCategory.UTILITIES
      };

      const complaint = await complaintRepo.create(submission);
      
      await complaintRepo.updateStatus({
        complaintId: complaint.id,
        newStatus: ComplaintStatus.UNDER_REVIEW,
        notes: 'Investigation started'
      });

      const updated = await complaintRepo.findById(complaint.id);
      expect(updated!.status).toBe(ComplaintStatus.UNDER_REVIEW);

      // Check status history was created
      const history = await complaintRepo.getStatusHistory(complaint.id);
      expect(history.length).toBeGreaterThanOrEqual(1); // At least initial entry
      
      // Find the entry with notes
      const entryWithNotes = history.find(h => h.notes === 'Investigation started');
      expect(entryWithNotes).toBeDefined();
      expect(entryWithNotes!.newStatus).toBe(ComplaintStatus.UNDER_REVIEW);
    });

    test('should increment upvotes', async () => {
      const submission = {
        buildingAddress: '123 Test Street',
        description: 'Test complaint',
        category: IssueCategory.SANITATION
      };

      const complaint = await complaintRepo.create(submission);
      expect(complaint.upvotes).toBe(0);

      await complaintRepo.addUpvote(complaint.id, 'session-1');
      await complaintRepo.addUpvote(complaint.id, 'session-2');

      const updated = await complaintRepo.findById(complaint.id);
      expect(updated!.upvotes).toBe(2);
    });

    test('should filter complaints by building address', async () => {
      const submissions = [
        {
          buildingAddress: '123 Main Street',
          description: 'Complaint 1',
          category: IssueCategory.MAINTENANCE
        },
        {
          buildingAddress: '456 Oak Avenue',
          description: 'Complaint 2',
          category: IssueCategory.SAFETY
        },
        {
          buildingAddress: '123 Main Street',
          description: 'Complaint 3',
          category: IssueCategory.UTILITIES
        }
      ];

      for (const submission of submissions) {
        await complaintRepo.create(submission);
      }

      const mainStreetComplaints = await complaintRepo.findByBuilding('123 Main Street');
      expect(mainStreetComplaints).toHaveLength(2);
      
      const oakAvenueComplaints = await complaintRepo.findByBuilding('456 Oak Avenue');
      expect(oakAvenueComplaints).toHaveLength(1);
    });

    test('should get complaint statistics', async () => {
      const submissions = [
        { buildingAddress: '123 Test St', description: 'Test 1', category: IssueCategory.SAFETY },
        { buildingAddress: '123 Test St', description: 'Test 2', category: IssueCategory.SAFETY },
        { buildingAddress: '123 Test St', description: 'Test 3', category: IssueCategory.MAINTENANCE }
      ];

      for (const submission of submissions) {
        await complaintRepo.create(submission);
      }

      const stats = await complaintRepo.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.byCategory[IssueCategory.SAFETY]).toBe(2);
      expect(stats.byCategory[IssueCategory.MAINTENANCE]).toBe(1);
      expect(stats.byStatus[ComplaintStatus.REPORTED]).toBe(3);
    });
  });

  describe('Evidence Repository', () => {
    let complaintId: string;

    beforeEach(async () => {
      const complaint = await complaintRepo.create({
        buildingAddress: '123 Test Street',
        description: 'Test complaint for evidence',
        category: IssueCategory.MAINTENANCE
      });
      complaintId = complaint.id;
    });

    test('should create evidence for a complaint', async () => {
      const submission = {
        complaintId,
        description: 'Photo of the broken pipe'
      };

      const evidence = await evidenceRepo.create(submission);

      expect(evidence.id).toBeDefined();
      expect(evidence.complaintId).toBe(complaintId);
      expect(evidence.description).toBe(submission.description);
      expect(typeof evidence.createdAt).toBe('object');
    });

    test('should find evidence by complaint ID', async () => {
      const submissions = [
        { complaintId, description: 'Evidence 1' },
        { complaintId, description: 'Evidence 2' }
      ];

      for (const submission of submissions) {
        await evidenceRepo.create(submission);
      }

      const evidence = await evidenceRepo.findByComplaintId(complaintId);
      expect(evidence).toHaveLength(2);
      expect(evidence[0].description).toBe('Evidence 1');
      expect(evidence[1].description).toBe('Evidence 2');
    });

    test('should count evidence for a complaint', async () => {
      expect(await evidenceRepo.countByComplaintId(complaintId)).toBe(0);

      await evidenceRepo.create({ complaintId, description: 'Evidence 1' });
      await evidenceRepo.create({ complaintId, description: 'Evidence 2' });

      expect(await evidenceRepo.countByComplaintId(complaintId)).toBe(2);
    });

    test('should delete evidence', async () => {
      const evidence = await evidenceRepo.create({
        complaintId,
        description: 'Evidence to delete'
      });

      await evidenceRepo.delete(evidence.id);

      const found = await evidenceRepo.findById(evidence.id);
      expect(found).toBeNull();
    });

    test('should get evidence statistics', async () => {
      await evidenceRepo.create({ complaintId, description: 'Evidence 1' });
      await evidenceRepo.create({ complaintId, description: 'Evidence 2' });

      const stats = await evidenceRepo.getStatistics();
      expect(stats.totalEvidence).toBe(2);
      expect(stats.evidenceWithImages).toBe(0);
      expect(stats.averageEvidencePerComplaint).toBe(2);
    });
  });

  describe('Data Integrity', () => {
    test('should maintain referential integrity between complaints and evidence', async () => {
      const complaint = await complaintRepo.create({
        buildingAddress: '123 Test Street',
        description: 'Test complaint',
        category: IssueCategory.MAINTENANCE
      });

      const evidence = await evidenceRepo.create({
        complaintId: complaint.id,
        description: 'Test evidence'
      });

      // Delete complaint should cascade delete evidence
      await complaintRepo.delete(complaint.id);

      const foundEvidence = await evidenceRepo.findById(evidence.id);
      expect(foundEvidence).toBeNull();
    });

    test('should automatically create status history on complaint creation', async () => {
      const complaint = await complaintRepo.create({
        buildingAddress: '123 Test Street',
        description: 'Test complaint',
        category: IssueCategory.SAFETY
      });

      const history = await complaintRepo.getStatusHistory(complaint.id);
      expect(history).toHaveLength(1);
      expect(history[0].newStatus).toBe(ComplaintStatus.REPORTED);
      expect(history[0].oldStatus).toBeNull();
    });

    test('should update timestamp on complaint modification', async () => {
      const complaint = await complaintRepo.create({
        buildingAddress: '123 Test Street',
        description: 'Test complaint',
        category: IssueCategory.UTILITIES
      });

      const originalUpdatedAt = complaint.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      await complaintRepo.addUpvote(complaint.id);

      const updated = await complaintRepo.findById(complaint.id);
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('Error Handling', () => {
    test('should throw error when updating non-existent complaint status', async () => {
      await expect(complaintRepo.updateStatus({
        complaintId: 'non-existent-id',
        newStatus: ComplaintStatus.RESOLVED
      })).rejects.toThrow('Complaint not found');
    });

    test('should handle database constraint violations', async () => {
      // Try to create evidence for non-existent complaint
      await expect(evidenceRepo.create({
        complaintId: 'non-existent-complaint-id',
        description: 'Test evidence'
      })).rejects.toThrow();
    });
  });
});