/**
 * CRUD operations for evidence table
 */

import { v4 as uuidv4 } from 'uuid';
import { Database } from './connection';
import { Evidence } from '../../../shared/src/types';

export interface EvidenceSubmission {
  complaintId: string;
  description: string;
  imageFile?: {
    name: string;
    path: string;
  };
}

export class EvidenceRepository {
  constructor(private db: Database) {}

  /**
   * Create new evidence for a complaint
   */
  async create(submission: EvidenceSubmission): Promise<Evidence> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const sql = `
      INSERT INTO evidence (id, complaint_id, description, image_url, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const imageUrl = submission.imageFile 
      ? `/uploads/evidence/${submission.imageFile.name}`
      : null;

    const params = [
      id,
      submission.complaintId,
      submission.description,
      imageUrl,
      now
    ];

    await this.db.run(sql, params);

    return this.findById(id) as Promise<Evidence>;
  }

  /**
   * Find evidence by ID
   */
  async findById(id: string): Promise<Evidence | null> {
    const sql = `
      SELECT 
        id, complaint_id as complaintId, description, 
        image_url as imageUrl, created_at as createdAt
      FROM evidence 
      WHERE id = ?
    `;

    const row = await this.db.get(sql, [id]);
    if (!row) return null;

    return {
      id: row.id,
      complaintId: row.complaintId,
      description: row.description,
      imageUrl: row.imageUrl,
      createdAt: new Date(row.createdAt)
    };
  }

  /**
   * Find all evidence for a complaint
   */
  async findByComplaintId(complaintId: string): Promise<Evidence[]> {
    const sql = `
      SELECT 
        id, complaint_id as complaintId, description, 
        image_url as imageUrl, created_at as createdAt
      FROM evidence 
      WHERE complaint_id = ?
      ORDER BY created_at ASC
    `;

    const rows = await this.db.all(sql, [complaintId]);
    
    return rows.map((row: any) => ({
      id: row.id,
      complaintId: row.complaintId,
      description: row.description,
      imageUrl: row.imageUrl,
      createdAt: new Date(row.createdAt)
    }));
  }

  /**
   * Find all evidence with pagination
   */
  async findMany(options: {
    limit?: number;
    offset?: number;
    complaintId?: string;
  } = {}): Promise<Evidence[]> {
    let sql = `
      SELECT 
        id, complaint_id as complaintId, description, 
        image_url as imageUrl, created_at as createdAt
      FROM evidence 
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (options.complaintId) {
      sql += ' AND complaint_id = ?';
      params.push(options.complaintId);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = await this.db.all(sql, params);
    
    return rows.map((row: any) => ({
      id: row.id,
      complaintId: row.complaintId,
      description: row.description,
      imageUrl: row.imageUrl,
      createdAt: new Date(row.createdAt)
    }));
  }

  /**
   * Update evidence description
   */
  async updateDescription(id: string, description: string): Promise<void> {
    const sql = 'UPDATE evidence SET description = ? WHERE id = ?';
    await this.db.run(sql, [description, id]);
  }

  /**
   * Delete evidence
   */
  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM evidence WHERE id = ?';
    await this.db.run(sql, [id]);
  }

  /**
   * Delete all evidence for a complaint
   */
  async deleteByComplaintId(complaintId: string): Promise<void> {
    const sql = 'DELETE FROM evidence WHERE complaint_id = ?';
    await this.db.run(sql, [complaintId]);
  }

  /**
   * Count evidence for a complaint
   */
  async countByComplaintId(complaintId: string): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM evidence WHERE complaint_id = ?';
    const result = await this.db.get(sql, [complaintId]);
    return result?.count || 0;
  }

  /**
   * Get evidence statistics
   */
  async getStatistics(): Promise<{
    totalEvidence: number;
    evidenceWithImages: number;
    averageEvidencePerComplaint: number;
  }> {
    const totalSql = 'SELECT COUNT(*) as total FROM evidence';
    const withImagesSql = 'SELECT COUNT(*) as count FROM evidence WHERE image_url IS NOT NULL';
    const avgSql = `
      SELECT AVG(evidence_count) as average FROM (
        SELECT COUNT(*) as evidence_count 
        FROM evidence 
        GROUP BY complaint_id
      )
    `;

    const [totalResult, withImagesResult, avgResult] = await Promise.all([
      this.db.get(totalSql),
      this.db.get(withImagesSql),
      this.db.get(avgSql)
    ]);

    return {
      totalEvidence: totalResult?.total || 0,
      evidenceWithImages: withImagesResult?.count || 0,
      averageEvidencePerComplaint: avgResult?.average || 0
    };
  }
}