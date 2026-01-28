/**
 * CRUD operations for complaints table
 */

import { v4 as uuidv4 } from 'uuid';
import { Database } from './connection';
import { 
  Complaint, 
  ComplaintSubmission, 
  ComplaintFilters, 
  IssueCategory, 
  ComplaintStatus,
  StatusUpdate,
  StatusHistory,
  ClassificationResult
} from '../../../shared/src/types';
import { aiClassifier } from '../services/aiClassifier';

export class ComplaintRepository {
  constructor(private db: Database) {}

  /**
   * Create a new complaint
   */
  async create(submission: ComplaintSubmission): Promise<Complaint> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Use AI classifier to analyze the complaint text
    const classificationResult = aiClassifier.classifyComplaint(submission.description);
    
    // Determine final category:
    // 1. If user provided category, use it and mark as user-confirmed
    // 2. If AI confidence is high and no user category, use AI category
    // 3. If AI confidence is low, use AI category but mark as needing confirmation
    let finalCategory: IssueCategory;
    let userConfirmed = false;
    
    if (submission.category) {
      // User provided category - use it and mark as confirmed
      finalCategory = submission.category;
      userConfirmed = true;
    } else if (aiClassifier.isConfidenceHigh(classificationResult.confidence)) {
      // High confidence AI classification - use it
      finalCategory = classificationResult.category;
      userConfirmed = false;
    } else {
      // Low confidence - use AI suggestion but mark for manual review
      finalCategory = classificationResult.category;
      userConfirmed = false;
    }
    
    const sql = `
      INSERT INTO complaints (
        id, building_address, description, category, status, 
        image_url, upvotes, landlord_name, landlord_contact, 
        ai_category, ai_confidence, user_confirmed_category,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Handle image URL - if imageFile is provided, it should have a filename
    let imageUrl = null;
    if (submission.imageFile && 'filename' in submission.imageFile) {
      imageUrl = `/uploads/${(submission.imageFile as any).filename}`;
    }

    const params = [
      id,
      submission.buildingAddress,
      submission.description,
      finalCategory,
      ComplaintStatus.REPORTED,
      imageUrl,
      0,
      submission.landlordInfo?.name || null,
      submission.landlordInfo?.contactInfo || null,
      classificationResult.category,
      classificationResult.confidence,
      userConfirmed ? 1 : 0,
      now,
      now
    ];

    await this.db.run(sql, params);

    return this.findById(id) as Promise<Complaint>;
  }

  /**
   * Find complaint by ID
   */
  async findById(id: string): Promise<Complaint | null> {
    const sql = `
      SELECT 
        id, building_address as buildingAddress, description, category, status,
        image_url as imageUrl, upvotes, landlord_name as landlordName,
        landlord_contact as landlordContact, ai_category as aiCategory,
        ai_confidence as aiConfidence, user_confirmed_category as userConfirmedCategory,
        created_at as createdAt, updated_at as updatedAt
      FROM complaints 
      WHERE id = ?
    `;

    const row = await this.db.get(sql, [id]);
    if (!row) return null;

    // Get evidence for this complaint
    const evidence = await this.getEvidence(id);

    return this.mapRowToComplaint(row, evidence);
  }

  /**
   * Find complaints with filters
   */
  async findMany(filters: ComplaintFilters = {}): Promise<Complaint[]> {
    let sql = `
      SELECT 
        id, building_address as buildingAddress, description, category, status,
        image_url as imageUrl, upvotes, landlord_name as landlordName,
        landlord_contact as landlordContact, ai_category as aiCategory,
        ai_confidence as aiConfidence, user_confirmed_category as userConfirmedCategory,
        created_at as createdAt, updated_at as updatedAt
      FROM complaints 
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (filters.buildingAddress) {
      sql += ' AND building_address LIKE ?';
      params.push(`%${filters.buildingAddress}%`);
    }

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.landlordName) {
      sql += ' AND landlord_name LIKE ?';
      params.push(`%${filters.landlordName}%`);
    }

    if (filters.dateFrom) {
      sql += ' AND created_at >= ?';
      params.push(filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      sql += ' AND created_at <= ?';
      params.push(filters.dateTo.toISOString());
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }

    const rows = await this.db.all(sql, params);
    
    // Get evidence for all complaints
    const complaints = await Promise.all(
      rows.map(async (row: any) => {
        const evidence = await this.getEvidence(row.id);
        return this.mapRowToComplaint(row, evidence);
      })
    );

    return complaints;
  }

  /**
   * Update complaint status
   */
  async updateStatus(update: StatusUpdate): Promise<void> {
    // Get current status first
    const current = await this.findById(update.complaintId);
    if (!current) {
      throw new Error('Complaint not found');
    }

    await this.db.beginTransaction();
    
    try {
      const sql = 'UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?';
      const params = [update.newStatus, new Date().toISOString(), update.complaintId];

      await this.db.run(sql, params);

      // Create status history entry with notes (the trigger will create one without notes)
      if (update.notes) {
        await this.createStatusHistory(
          update.complaintId, 
          current.status, 
          update.newStatus, 
          update.notes
        );
      }

      await this.db.commit();
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Get complaints by building address
   */
  async findByBuilding(buildingAddress: string): Promise<Complaint[]> {
    return this.findMany({ buildingAddress });
  }

  /**
   * Get complaints by landlord
   */
  async findByLandlord(landlordName: string): Promise<Complaint[]> {
    return this.findMany({ landlordName });
  }

  /**
   * Get complaint statistics
   */
  async getStatistics(filters: ComplaintFilters = {}): Promise<{
    total: number;
    byCategory: Record<IssueCategory, number>;
    byStatus: Record<ComplaintStatus, number>;
  }> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.buildingAddress) {
      whereClause += ' AND building_address LIKE ?';
      params.push(`%${filters.buildingAddress}%`);
    }

    if (filters.landlordName) {
      whereClause += ' AND landlord_name LIKE ?';
      params.push(`%${filters.landlordName}%`);
    }

    if (filters.dateFrom) {
      whereClause += ' AND created_at >= ?';
      params.push(filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      whereClause += ' AND created_at <= ?';
      params.push(filters.dateTo.toISOString());
    }

    // Get total count
    const totalResult = await this.db.get(
      `SELECT COUNT(*) as total FROM complaints ${whereClause}`,
      params
    );

    // Get counts by category
    const categoryResults = await this.db.all(
      `SELECT category, COUNT(*) as count FROM complaints ${whereClause} GROUP BY category`,
      params
    );

    // Get counts by status
    const statusResults = await this.db.all(
      `SELECT status, COUNT(*) as count FROM complaints ${whereClause} GROUP BY status`,
      params
    );

    const byCategory = {} as Record<IssueCategory, number>;
    Object.values(IssueCategory).forEach(cat => byCategory[cat] = 0);
    categoryResults.forEach((row: any) => {
      byCategory[row.category as IssueCategory] = row.count;
    });

    const byStatus = {} as Record<ComplaintStatus, number>;
    Object.values(ComplaintStatus).forEach(status => byStatus[status] = 0);
    statusResults.forEach((row: any) => {
      byStatus[row.status as ComplaintStatus] = row.count;
    });

    return {
      total: totalResult?.total || 0,
      byCategory,
      byStatus
    };
  }

  /**
   * Update complaint category (manual override)
   */
  async updateCategory(complaintId: string, newCategory: IssueCategory): Promise<void> {
    const sql = `
      UPDATE complaints 
      SET category = ?, user_confirmed_category = 1, updated_at = ? 
      WHERE id = ?
    `;
    await this.db.run(sql, [newCategory, new Date().toISOString(), complaintId]);
  }

  /**
   * Get classification result for a complaint
   */
  async getClassificationResult(complaintId: string): Promise<ClassificationResult | null> {
    const complaint = await this.findById(complaintId);
    if (!complaint || !complaint.aiCategory) return null;

    // Get suggested categories by re-running classification
    const classificationResult = aiClassifier.classifyComplaint(complaint.description);
    
    return {
      category: complaint.aiCategory,
      confidence: complaint.aiConfidence || 0,
      suggestedCategories: classificationResult.suggestedCategories
    };
  }

  /**
   * Add an upvote to a complaint (for testing purposes)
   * In production, use UpvoteRepository for proper session tracking
   */
  async addUpvote(complaintId: string, sessionId: string = 'test-session'): Promise<void> {
    const sql = `
      INSERT OR IGNORE INTO upvotes (id, complaint_id, session_id, created_at)
      VALUES (?, ?, ?, ?)
    `;
    const params = [uuidv4(), complaintId, sessionId, new Date().toISOString()];
    await this.db.run(sql, params);
  }

  /**
   * Delete a complaint
   */
  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM complaints WHERE id = ?';
    await this.db.run(sql, [id]);
  }

  /**
   * Get evidence for a complaint
   */
  private async getEvidence(complaintId: string): Promise<any[]> {
    const sql = `
      SELECT 
        id, complaint_id as complaintId, description, 
        image_url as imageUrl, created_at as createdAt
      FROM evidence 
      WHERE complaint_id = ? 
      ORDER BY created_at ASC
    `;
    
    return this.db.all(sql, [complaintId]);
  }

  /**
   * Create status history entry
   */
  private async createStatusHistory(
    complaintId: string, 
    oldStatus: ComplaintStatus | null, 
    newStatus: ComplaintStatus,
    notes?: string
  ): Promise<void> {
    const sql = `
      INSERT INTO status_history (id, complaint_id, old_status, new_status, notes, changed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      uuidv4(),
      complaintId,
      oldStatus,
      newStatus,
      notes || null,
      new Date().toISOString()
    ];

    await this.db.run(sql, params);
  }

  /**
   * Get status history for a complaint
   */
  async getStatusHistory(complaintId: string): Promise<StatusHistory[]> {
    const sql = `
      SELECT 
        id, complaint_id as complaintId, old_status as oldStatus,
        new_status as newStatus, notes, changed_at as changedAt
      FROM status_history 
      WHERE complaint_id = ? 
      ORDER BY changed_at ASC
    `;

    const rows = await this.db.all(sql, [complaintId]);
    return rows.map((row: any) => ({
      ...row,
      changedAt: new Date(row.changedAt)
    }));
  }

  /**
   * Map database row to Complaint object
   */
  private mapRowToComplaint(row: any, evidence: any[]): Complaint {
    return {
      id: row.id,
      buildingAddress: row.buildingAddress,
      description: row.description,
      category: row.category as IssueCategory,
      status: row.status as ComplaintStatus,
      imageUrl: row.imageUrl,
      upvotes: row.upvotes,
      evidence: evidence.map(e => ({
        ...e,
        createdAt: new Date(e.createdAt)
      })),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      landlordInfo: row.landlordName ? {
        name: row.landlordName,
        contactInfo: row.landlordContact
      } : undefined,
      // AI Classification fields
      aiCategory: row.aiCategory as IssueCategory | undefined,
      aiConfidence: row.aiConfidence,
      userConfirmedCategory: row.userConfirmedCategory === 1
    };
  }
}