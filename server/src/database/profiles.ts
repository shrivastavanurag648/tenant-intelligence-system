/**
 * Profile aggregation operations for building and landlord profiles
 */

import { Database } from './connection';
import { 
  BuildingProfile, 
  LandlordProfile, 
  Complaint,
  IssueCategory, 
  ComplaintStatus,
  LandlordInfo,
  ComplaintFilters
} from '../../../shared/src/types';

export class ProfileRepository {
  constructor(private db: Database) {}

  /**
   * Get building profile by address
   */
  async getBuildingProfile(address: string): Promise<BuildingProfile | null> {
    // Get all complaints for this building
    const complaintsQuery = `
      SELECT 
        id, building_address as buildingAddress, description, category, status,
        image_url as imageUrl, upvotes, landlord_name as landlordName,
        landlord_contact as landlordContact, ai_category as aiCategory,
        ai_confidence as aiConfidence, user_confirmed_category as userConfirmedCategory,
        created_at as createdAt, updated_at as updatedAt
      FROM complaints 
      WHERE building_address = ?
      ORDER BY created_at DESC
    `;

    const complaintRows = await this.db.all(complaintsQuery, [address]);
    
    if (complaintRows.length === 0) {
      return null; // No complaints for this building
    }

    // Get statistics
    const stats = await this.getBuildingStatistics(address);
    
    // Get recent complaints (last 10)
    const recentComplaints = await this.getRecentComplaints(address, 10);
    
    // Get landlord info from the most recent complaint that has it
    const landlordInfo = this.extractLandlordInfo(complaintRows);
    
    // Calculate average resolution time
    const averageResolutionTime = await this.calculateAverageResolutionTime(address);

    return {
      address,
      totalComplaints: stats.total,
      complaintsByCategory: stats.byCategory,
      complaintsByStatus: stats.byStatus,
      averageResolutionTime,
      recentComplaints,
      landlordInfo
    };
  }

  /**
   * Get landlord profile by name
   */
  async getLandlordProfile(landlordName: string): Promise<LandlordProfile | null> {
    // Get all properties managed by this landlord
    const propertiesQuery = `
      SELECT DISTINCT building_address 
      FROM complaints 
      WHERE landlord_name = ?
      ORDER BY building_address
    `;

    const propertyRows = await this.db.all(propertiesQuery, [landlordName]);
    
    if (propertyRows.length === 0) {
      return null; // No properties for this landlord
    }

    const properties = propertyRows.map((row: any) => row.building_address);

    // Get statistics across all properties
    const stats = await this.getLandlordStatistics(landlordName);
    
    // Calculate average resolution time across all properties
    const averageResolutionTime = await this.calculateLandlordAverageResolutionTime(landlordName);
    
    // Calculate response rate (percentage of complaints that moved beyond "Reported" status)
    const responseRate = await this.calculateResponseRate(landlordName);

    return {
      id: landlordName, // Using name as ID for simplicity
      name: landlordName,
      properties,
      totalComplaints: stats.total,
      complaintsByCategory: stats.byCategory,
      averageResolutionTime,
      responseRate
    };
  }

  /**
   * Get all building addresses with complaints
   */
  async getAllBuildingAddresses(): Promise<string[]> {
    const query = `
      SELECT DISTINCT building_address 
      FROM complaints 
      ORDER BY building_address
    `;

    const rows = await this.db.all(query);
    return rows.map((row: any) => row.building_address);
  }

  /**
   * Get all landlord names
   */
  async getAllLandlordNames(): Promise<string[]> {
    const query = `
      SELECT DISTINCT landlord_name 
      FROM complaints 
      WHERE landlord_name IS NOT NULL
      ORDER BY landlord_name
    `;

    const rows = await this.db.all(query);
    return rows.map((row: any) => row.landlord_name);
  }

  /**
   * Get building statistics
   */
  private async getBuildingStatistics(address: string): Promise<{
    total: number;
    byCategory: Record<IssueCategory, number>;
    byStatus: Record<ComplaintStatus, number>;
  }> {
    // Get total count
    const totalResult = await this.db.get(
      'SELECT COUNT(*) as total FROM complaints WHERE building_address = ?',
      [address]
    );

    // Get counts by category
    const categoryResults = await this.db.all(
      'SELECT category, COUNT(*) as count FROM complaints WHERE building_address = ? GROUP BY category',
      [address]
    );

    // Get counts by status
    const statusResults = await this.db.all(
      'SELECT status, COUNT(*) as count FROM complaints WHERE building_address = ? GROUP BY status',
      [address]
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
   * Get landlord statistics across all properties
   */
  private async getLandlordStatistics(landlordName: string): Promise<{
    total: number;
    byCategory: Record<IssueCategory, number>;
  }> {
    // Get total count
    const totalResult = await this.db.get(
      'SELECT COUNT(*) as total FROM complaints WHERE landlord_name = ?',
      [landlordName]
    );

    // Get counts by category
    const categoryResults = await this.db.all(
      'SELECT category, COUNT(*) as count FROM complaints WHERE landlord_name = ? GROUP BY category',
      [landlordName]
    );

    const byCategory = {} as Record<IssueCategory, number>;
    Object.values(IssueCategory).forEach(cat => byCategory[cat] = 0);
    categoryResults.forEach((row: any) => {
      byCategory[row.category as IssueCategory] = row.count;
    });

    return {
      total: totalResult?.total || 0,
      byCategory
    };
  }

  /**
   * Get recent complaints for a building
   */
  private async getRecentComplaints(address: string, limit: number): Promise<Complaint[]> {
    const query = `
      SELECT 
        id, building_address as buildingAddress, description, category, status,
        image_url as imageUrl, upvotes, landlord_name as landlordName,
        landlord_contact as landlordContact, ai_category as aiCategory,
        ai_confidence as aiConfidence, user_confirmed_category as userConfirmedCategory,
        created_at as createdAt, updated_at as updatedAt
      FROM complaints 
      WHERE building_address = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const rows = await this.db.all(query, [address, limit]);
    
    // Get evidence for each complaint
    const complaints = await Promise.all(
      rows.map(async (row: any) => {
        const evidence = await this.getEvidence(row.id);
        return this.mapRowToComplaint(row, evidence);
      })
    );

    return complaints;
  }

  /**
   * Calculate average resolution time for a building (in days)
   */
  private async calculateAverageResolutionTime(address: string): Promise<number> {
    const query = `
      SELECT 
        c.created_at,
        sh.changed_at as resolved_at
      FROM complaints c
      JOIN status_history sh ON c.id = sh.complaint_id
      WHERE c.building_address = ? 
        AND sh.new_status IN ('Resolved', 'Dismissed')
      ORDER BY sh.changed_at DESC
    `;

    const rows = await this.db.all(query, [address]);
    
    if (rows.length === 0) return 0;

    const totalDays = rows.reduce((sum: number, row: any) => {
      const created = new Date(row.created_at);
      const resolved = new Date(row.resolved_at);
      const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return Math.round(totalDays / rows.length * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate average resolution time for a landlord across all properties (in days)
   */
  private async calculateLandlordAverageResolutionTime(landlordName: string): Promise<number> {
    const query = `
      SELECT 
        c.created_at,
        sh.changed_at as resolved_at
      FROM complaints c
      JOIN status_history sh ON c.id = sh.complaint_id
      WHERE c.landlord_name = ? 
        AND sh.new_status IN ('Resolved', 'Dismissed')
      ORDER BY sh.changed_at DESC
    `;

    const rows = await this.db.all(query, [landlordName]);
    
    if (rows.length === 0) return 0;

    const totalDays = rows.reduce((sum: number, row: any) => {
      const created = new Date(row.created_at);
      const resolved = new Date(row.resolved_at);
      const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return Math.round(totalDays / rows.length * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate response rate for a landlord (percentage of complaints that moved beyond "Reported")
   */
  private async calculateResponseRate(landlordName: string): Promise<number> {
    const totalQuery = `
      SELECT COUNT(*) as total 
      FROM complaints 
      WHERE landlord_name = ?
    `;

    const respondedQuery = `
      SELECT COUNT(*) as responded 
      FROM complaints 
      WHERE landlord_name = ? 
        AND status != 'Reported'
    `;

    const totalResult = await this.db.get(totalQuery, [landlordName]);
    const respondedResult = await this.db.get(respondedQuery, [landlordName]);

    const total = totalResult?.total || 0;
    const responded = respondedResult?.responded || 0;

    if (total === 0) return 0;

    return Math.round((responded / total) * 100 * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Extract landlord info from complaint rows
   */
  private extractLandlordInfo(complaintRows: any[]): LandlordInfo | undefined {
    // Find the most recent complaint with landlord info
    for (const row of complaintRows) {
      if (row.landlordName) {
        return {
          name: row.landlordName,
          contactInfo: row.landlordContact || undefined
        };
      }
    }
    return undefined;
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