/**
 * Database initialization script
 * Run this to set up the database for the first time
 */

import { initializeDatabase, closeDatabase } from './connection';
import { config } from 'dotenv';

// Load environment variables
config();

async function initDatabase() {
  try {
    console.log('Initializing Tenant Intelligence System database...');
    
    const db = await initializeDatabase();
    console.log('Database initialized successfully!');
    
    // Verify tables were created
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('Created tables:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.name}`);
    });

    // Verify indexes were created
    const indexes = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('Created indexes:');
    indexes.forEach((index: any) => {
      console.log(`  - ${index.name}`);
    });

    // Verify triggers were created
    const triggers = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger'
      ORDER BY name
    `);
    
    console.log('Created triggers:');
    triggers.forEach((trigger: any) => {
      console.log(`  - ${trigger.name}`);
    });

    await closeDatabase();
    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initDatabase();
}

export { initDatabase };