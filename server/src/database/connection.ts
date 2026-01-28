/**
 * Database connection and initialization for SQLite
 */

import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MigrationRunner, migrations } from './migrations';

// Enable verbose mode for debugging in development
const sqlite = sqlite3.verbose();

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = 'tenant_intelligence.db') {
    this.dbPath = dbPath;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
          return;
        }
        
        console.log(`Connected to SQLite database at ${this.dbPath}`);
        this.createTables()
          .then(() => this.runMigrations())
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  /**
   * Create database tables from schema file
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const schemaPath = join(__dirname, 'schema.sql');
        const schema = readFileSync(schemaPath, 'utf8');
        
        // Execute schema SQL
        this.db!.exec(schema, (err) => {
          if (err) {
            console.error('Error creating tables:', err.message);
            reject(err);
            return;
          }
          
          console.log('Database tables created successfully');
          resolve();
        });
      } catch (error) {
        console.error('Error reading schema file:', error);
        reject(error);
      }
    });
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const migrationRunner = new MigrationRunner(this);
    await migrationRunner.runMigrations(migrations);
  }

  /**
   * Get database instance
   */
  getDb(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
          return;
        }
        
        console.log('Database connection closed');
        this.db = null;
        resolve();
      });
    });
  }

  /**
   * Execute a query with parameters
   */
  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this);
      });
    });
  }

  /**
   * Get a single row from query
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row as T);
      });
    });
  }

  /**
   * Get all rows from query
   */
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows as T[]);
      });
    });
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<void> {
    await this.run('BEGIN TRANSACTION');
  }

  /**
   * Commit a transaction
   */
  async commit(): Promise<void> {
    await this.run('COMMIT');
  }

  /**
   * Rollback a transaction
   */
  async rollback(): Promise<void> {
    await this.run('ROLLBACK');
  }
}

// Singleton database instance
let dbInstance: Database | null = null;

/**
 * Get the singleton database instance
 */
export function getDatabase(): Database {
  if (!dbInstance) {
    const dbPath = process.env.NODE_ENV === 'test' 
      ? ':memory:' 
      : process.env.DATABASE_PATH || 'tenant_intelligence.db';
    
    dbInstance = new Database(dbPath);
  }
  return dbInstance;
}

/**
 * Initialize the database (call this on app startup)
 */
export async function initializeDatabase(): Promise<Database> {
  const db = getDatabase();
  await db.initialize();
  return db;
}

/**
 * Close the database connection (call this on app shutdown)
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}