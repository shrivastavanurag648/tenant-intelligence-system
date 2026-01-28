/**
 * Database migration system
 * Handles database schema changes and versioning
 */

import { Database } from './connection';

export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

export class MigrationRunner {
  constructor(private db: Database) {}

  /**
   * Initialize migration tracking table
   */
  async initializeMigrations(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await this.db.run(sql);
  }

  /**
   * Get applied migrations
   */
  async getAppliedMigrations(): Promise<number[]> {
    await this.initializeMigrations();
    
    const rows = await this.db.all('SELECT version FROM migrations ORDER BY version');
    return rows.map((row: any) => row.version);
  }

  /**
   * Apply a migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    await this.db.beginTransaction();
    
    try {
      // Split migration SQL by semicolons and execute each statement
      const statements = migration.up
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        try {
          await this.db.run(statement);
        } catch (error: any) {
          // Ignore "duplicate column" errors for migration 2 (AI classification fields)
          if (migration.version === 2 && error.message && error.message.includes('duplicate column')) {
            console.log(`Skipping duplicate column in migration ${migration.version}: ${error.message}`);
            continue;
          }
          throw error;
        }
      }
      
      // Record migration as applied
      await this.db.run(
        'INSERT INTO migrations (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );
      
      await this.db.commit();
      console.log(`Applied migration ${migration.version}: ${migration.name}`);
      
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    await this.db.beginTransaction();
    
    try {
      // Execute rollback SQL
      await this.db.run(migration.down);
      
      // Remove migration record
      await this.db.run('DELETE FROM migrations WHERE version = ?', [migration.version]);
      
      await this.db.commit();
      console.log(`Rolled back migration ${migration.version}: ${migration.name}`);
      
    } catch (error) {
      await this.db.rollback();
      throw error;
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(migrations: Migration[]): Promise<void> {
    const appliedVersions = await this.getAppliedMigrations();
    const pendingMigrations = migrations.filter(m => !appliedVersions.includes(m.version));
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    // Sort by version
    pendingMigrations.sort((a, b) => a.version - b.version);
    
    console.log(`Running ${pendingMigrations.length} pending migrations...`);
    
    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }
    
    console.log('All migrations completed successfully');
  }
}

// Example migrations (for future use)
export const migrations: Migration[] = [
  // Migration 1: Initial schema (already handled by schema.sql)
  {
    version: 1,
    name: 'initial_schema',
    up: '-- Initial schema already created',
    down: 'DROP TABLE IF EXISTS status_history; DROP TABLE IF EXISTS evidence; DROP TABLE IF EXISTS complaints;'
  },
  
  // Migration 2: Add AI classification fields
  {
    version: 2,
    name: 'add_ai_classification_fields',
    up: `
      ALTER TABLE complaints ADD COLUMN ai_category TEXT CHECK (ai_category IN ('Safety', 'Maintenance', 'Sanitation', 'Utilities'));
      ALTER TABLE complaints ADD COLUMN ai_confidence REAL;
      ALTER TABLE complaints ADD COLUMN user_confirmed_category INTEGER DEFAULT 0 CHECK (user_confirmed_category IN (0, 1));
    `,
    down: `
      -- SQLite doesn't support DROP COLUMN, so we would need to recreate the table
      -- For demo purposes, this is acceptable
      SELECT 'Cannot rollback - SQLite limitation';
    `
  }
];