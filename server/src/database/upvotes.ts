/**
 * CRUD operations for upvotes table
 */

import { v4 as uuidv4 } from 'uuid';
import { Database } from './connection';

export interface UpvoteRecord {
  id: string;
  complaintId: string;
  sessionId: string;
  ipAddress?: string;
  createdAt: Date;
}

export class UpvoteRepository {
  constructor(private db: Database) {}

  /**
   * Add an upvote for a complaint from a session
   */
  async addUpvote(complaintId: string, sessionId: string, ipAddress?: string): Promise<boolean> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      const sql = `
        INSERT INTO upvotes (id, complaint_id, session_id, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?)
      `;

      await this.db.run(sql, [id, complaintId, sessionId, ipAddress, now]);
      return true;
    } catch (error: any) {
      // Handle unique constraint violation (duplicate upvote)
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Remove an upvote for a complaint from a session
   */
  async removeUpvote(complaintId: string, sessionId: string): Promise<boolean> {
    const sql = 'DELETE FROM upvotes WHERE complaint_id = ? AND session_id = ?';
    const result = await this.db.run(sql, [complaintId, sessionId]);
    return (result.changes || 0) > 0;
  }

  /**
   * Check if a session has already upvoted a complaint
   */
  async hasUpvoted(complaintId: string, sessionId: string): Promise<boolean> {
    const sql = 'SELECT 1 FROM upvotes WHERE complaint_id = ? AND session_id = ? LIMIT 1';
    const result = await this.db.get(sql, [complaintId, sessionId]);
    return !!result;
  }

  /**
   * Get upvote count for a complaint
   */
  async getUpvoteCount(complaintId: string): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM upvotes WHERE complaint_id = ?';
    const result = await this.db.get(sql, [complaintId]);
    return result?.count || 0;
  }

  /**
   * Get all upvotes for a complaint
   */
  async getUpvotesByComplaint(complaintId: string): Promise<UpvoteRecord[]> {
    const sql = `
      SELECT 
        id, complaint_id as complaintId, session_id as sessionId,
        ip_address as ipAddress, created_at as createdAt
      FROM upvotes 
      WHERE complaint_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.all(sql, [complaintId]);
    
    return rows.map((row: any) => ({
      id: row.id,
      complaintId: row.complaintId,
      sessionId: row.sessionId,
      ipAddress: row.ipAddress,
      createdAt: new Date(row.createdAt)
    }));
  }

  /**
   * Get upvote statistics
   */
  async getStatistics(): Promise<{
    totalUpvotes: number;
    uniqueSessions: number;
    averageUpvotesPerComplaint: number;
  }> {
    const totalSql = 'SELECT COUNT(*) as total FROM upvotes';
    const sessionsSql = 'SELECT COUNT(DISTINCT session_id) as count FROM upvotes';
    const avgSql = `
      SELECT AVG(upvote_count) as average FROM (
        SELECT COUNT(*) as upvote_count 
        FROM upvotes 
        GROUP BY complaint_id
      )
    `;

    const [totalResult, sessionsResult, avgResult] = await Promise.all([
      this.db.get(totalSql),
      this.db.get(sessionsSql),
      this.db.get(avgSql)
    ]);

    return {
      totalUpvotes: totalResult?.total || 0,
      uniqueSessions: sessionsResult?.count || 0,
      averageUpvotesPerComplaint: avgResult?.average || 0
    };
  }

  /**
   * Clean up old upvotes (optional - for maintenance)
   */
  async cleanupOldUpvotes(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const sql = 'DELETE FROM upvotes WHERE created_at < ?';
    const result = await this.db.run(sql, [cutoffDate.toISOString()]);
    return result.changes || 0;
  }
}