/**
 * Database seeding script for realistic demo data
 * Creates patterns that reveal repeat-offender landlords, building issues, and neighborhood trends
 */

import { initializeDatabase, closeDatabase } from './connection';
import { ComplaintRepository } from './complaints';
import { EvidenceRepository } from './evidence';
import { UpvoteRepository } from './upvotes';
import { IssueCategory, ComplaintStatus } from '../../../shared/src/types';
import { config } from 'dotenv';

// Load environment variables
config();

// Strategic demo data designed to reveal clear patterns
const demoComplaints = [
  // DOWNTOWN DISTRICT - Slumlord Properties (repeat offender)
  {
    buildingAddress: '1247 Broadway, Apt 3A, New York, NY 10001',
    description: 'No heat for 2 weeks in January. Landlord ignores calls and emails. Temperature drops to 45°F at night.',
    category: IssueCategory.UTILITIES,
    landlordInfo: { name: 'Slumlord Properties LLC', contactInfo: 'noreply@slumlord.com' }
  },
  {
    buildingAddress: '1247 Broadway, Apt 5B, New York, NY 10001',
    description: 'Broken radiator leaking water all over floor. Same building as other heating complaints.',
    category: IssueCategory.UTILITIES,
    landlordInfo: { name: 'Slumlord Properties LLC', contactInfo: 'noreply@slumlord.com' }
  },
  {
    buildingAddress: '1249 Broadway, Apt 2C, New York, NY 10001',
    description: 'Electrical fire hazard - exposed wires in hallway. Building owned by same landlord with heating issues.',
    category: IssueCategory.SAFETY,
    landlordInfo: { name: 'Slumlord Properties LLC', contactInfo: 'noreply@slumlord.com' }
  },
  {
    buildingAddress: '1251 Broadway, Apt 1A, New York, NY 10001',
    description: 'Severe mold throughout apartment. Landlord refuses to address water damage from roof leak.',
    category: IssueCategory.SANITATION,
    landlordInfo: { name: 'Slumlord Properties LLC', contactInfo: 'noreply@slumlord.com' }
  },
  {
    buildingAddress: '1253 Broadway, Apt 4D, New York, NY 10001',
    description: 'No hot water for 3 months. Same management company as other problem buildings on this block.',
    category: IssueCategory.UTILITIES,
    landlordInfo: { name: 'Slumlord Properties LLC', contactInfo: 'noreply@slumlord.com' }
  },

  // RIVERSIDE HEIGHTS - Premium Properties (good landlord for contrast)
  {
    buildingAddress: '456 Riverside Drive, Apt 12A, New York, NY 10025',
    description: 'Kitchen faucet dripping constantly. Reported yesterday, maintenance scheduled for tomorrow.',
    category: IssueCategory.MAINTENANCE,
    landlordInfo: { name: 'Premium Properties Inc', contactInfo: 'service@premiumprop.com' }
  },
  {
    buildingAddress: '458 Riverside Drive, Apt 8B, New York, NY 10025',
    description: 'Dishwasher making unusual noise. Landlord responsive and professional.',
    category: IssueCategory.MAINTENANCE,
    landlordInfo: { name: 'Premium Properties Inc', contactInfo: 'service@premiumprop.com' }
  },

  // EAST VILLAGE - Urban Living Corp (moderate issues)
  {
    buildingAddress: '123 St. Marks Place, Apt 2B, New York, NY 10003',
    description: 'Cockroach problem in kitchen. Building-wide issue affecting multiple units.',
    category: IssueCategory.SANITATION,
    landlordInfo: { name: 'Urban Living Corp', contactInfo: 'help@urbanliving.com' }
  },
  {
    buildingAddress: '123 St. Marks Place, Apt 4A, New York, NY 10003',
    description: 'Same building - roaches in bathroom and bedroom. Pest control needed urgently.',
    category: IssueCategory.SANITATION,
    landlordInfo: { name: 'Urban Living Corp', contactInfo: 'help@urbanliving.com' }
  },
  {
    buildingAddress: '125 St. Marks Place, Apt 1C, New York, NY 10003',
    description: 'Broken front door security system. Building entrance unsecured for weeks.',
    category: IssueCategory.SAFETY,
    landlordInfo: { name: 'Urban Living Corp', contactInfo: 'help@urbanliving.com' }
  },

  // BROOKLYN HEIGHTS - Brooklyn Housing Corp (mixed record)
  {
    buildingAddress: '789 Montague Street, Apt 3B, Brooklyn, NY 11201',
    description: 'Water damage from upstairs leak causing ceiling collapse risk. Reported 2 months ago.',
    category: IssueCategory.SAFETY,
    landlordInfo: { name: 'Brooklyn Housing Corp', contactInfo: '(718) 555-0123' }
  },
  {
    buildingAddress: '791 Montague Street, Apt 5A, Brooklyn, NY 11201',
    description: 'No heat in winter - same management as water damage building. Pattern of neglect.',
    category: IssueCategory.UTILITIES,
    landlordInfo: { name: 'Brooklyn Housing Corp', contactInfo: '(718) 555-0123' }
  },
  {
    buildingAddress: '793 Montague Street, Apt 2D, Brooklyn, NY 11201',
    description: 'Broken elevator for 6 months. Elderly residents trapped on upper floors.',
    category: IssueCategory.MAINTENANCE,
    landlordInfo: { name: 'Brooklyn Housing Corp', contactInfo: '(718) 555-0123' }
  },

  // WILLIAMSBURG - Hipster Housing LLC (trendy but problematic)
  {
    buildingAddress: '234 Bedford Avenue, Apt 4C, Brooklyn, NY 11249',
    description: 'Lead paint peeling in bedroom. Health hazard especially dangerous for children.',
    category: IssueCategory.SAFETY,
    landlordInfo: { name: 'Hipster Housing LLC', contactInfo: 'yo@hipsterhousing.com' }
  },
  {
    buildingAddress: '236 Bedford Avenue, Apt 2A, Brooklyn, NY 11249',
    description: 'Same block - lead paint issues here too. Seems to be a pattern with this landlord.',
    category: IssueCategory.SAFETY,
    landlordInfo: { name: 'Hipster Housing LLC', contactInfo: 'yo@hipsterhousing.com' }
  },
  {
    buildingAddress: '238 Bedford Avenue, Apt 1B, Brooklyn, NY 11249',
    description: 'Rat infestation in kitchen. Third building on this block with serious problems.',
    category: IssueCategory.SANITATION,
    landlordInfo: { name: 'Hipster Housing LLC', contactInfo: 'yo@hipsterhousing.com' }
  },

  // QUEENS VILLAGE - Queens Residential LLC (safety issues)
  {
    buildingAddress: '567 Northern Boulevard, Apt 6A, Queens, NY 11375',
    description: 'Fire escape blocked by landlord storage. Major safety violation - residents cannot evacuate.',
    category: IssueCategory.SAFETY,
    landlordInfo: { name: 'Queens Residential LLC', contactInfo: 'info@queensres.com' }
  },
  {
    buildingAddress: '569 Northern Boulevard, Apt 3C, Queens, NY 11375',
    description: 'Smoke detectors removed by landlord. Same owner as blocked fire escape building.',
    category: IssueCategory.SAFETY,
    landlordInfo: { name: 'Queens Residential LLC', contactInfo: 'info@queensres.com' }
  },
  {
    buildingAddress: '571 Northern Boulevard, Apt 4B, Queens, NY 11375',
    description: 'Gas leak smell in hallway. Emergency situation - same negligent landlord.',
    category: IssueCategory.SAFETY,
    landlordInfo: { name: 'Queens Residential LLC', contactInfo: 'info@queensres.com' }
  },

  // ASTORIA - Astoria Management (utility problems)
  {
    buildingAddress: '890 Steinway Street, Apt 2A, Queens, NY 11103',
    description: 'Electricity cuts out randomly. Dangerous electrical system needs complete overhaul.',
    category: IssueCategory.UTILITIES,
    landlordInfo: { name: 'Astoria Management', contactInfo: 'contact@astoriamgmt.com' }
  },
  {
    buildingAddress: '892 Steinway Street, Apt 5B, Queens, NY 11103',
    description: 'No hot water for 2 weeks. Same management company as electrical problems next door.',
    category: IssueCategory.UTILITIES,
    landlordInfo: { name: 'Astoria Management', contactInfo: 'contact@astoriamgmt.com' }
  },

  // BRONX SOUTH - Bronx Property Solutions (various issues)
  {
    buildingAddress: '345 Grand Concourse, Apt 7C, Bronx, NY 10451',
    description: 'Broken windows throughout building. Security and weather protection compromised.',
    category: IssueCategory.MAINTENANCE,
    landlordInfo: { name: 'Bronx Property Solutions', contactInfo: 'info@bronxpropsolutions.com' }
  },
  {
    buildingAddress: '347 Grand Concourse, Apt 3A, Bronx, NY 10451',
    description: 'Sewage backup in basement affecting entire building. Health hazard.',
    category: IssueCategory.SANITATION,
    landlordInfo: { name: 'Bronx Property Solutions', contactInfo: 'info@bronxpropsolutions.com' }
  },

  // Additional complaints to show resolved vs unresolved patterns
  {
    buildingAddress: '1247 Broadway, Apt 6C, New York, NY 10001',
    description: 'Another heating complaint from Slumlord Properties building. This is getting ridiculous.',
    category: IssueCategory.UTILITIES,
    landlordInfo: { name: 'Slumlord Properties LLC', contactInfo: 'noreply@slumlord.com' }
  },
  {
    buildingAddress: '456 Riverside Drive, Apt 15B, New York, NY 10025',
    description: 'Minor plumbing issue - Premium Properties already scheduled repair for next week.',
    category: IssueCategory.MAINTENANCE,
    landlordInfo: { name: 'Premium Properties Inc', contactInfo: 'service@premiumprop.com' }
  }
];

const demoEvidence = [
  // Evidence for Slumlord Properties complaints (shows community verification)
  { complaintIndex: 0, description: 'Thermometer reading 43°F in living room at 8 AM' },
  { complaintIndex: 0, description: 'Neighbor in 3B confirms no heat for 2 weeks' },
  { complaintIndex: 1, description: 'Photo of water pooling from broken radiator' },
  { complaintIndex: 2, description: 'Video of exposed electrical wires sparking' },
  { complaintIndex: 2, description: 'Fire department inspection notice posted in lobby' },
  { complaintIndex: 3, description: 'Photos of black mold covering bedroom wall' },
  { complaintIndex: 4, description: 'Multiple tenants confirm no hot water building-wide' },
  
  // Evidence for building-wide issues
  { complaintIndex: 8, description: 'Photo of cockroaches in kitchen cabinet' },
  { complaintIndex: 9, description: 'Same building - roaches in multiple units confirmed' },
  { complaintIndex: 10, description: 'Video of broken security door hanging open' },
  
  // Evidence for safety issues in Queens
  { complaintIndex: 16, description: 'Photo of fire escape completely blocked with boxes' },
  { complaintIndex: 17, description: 'Picture of missing smoke detector with exposed wires' },
  { complaintIndex: 18, description: 'Gas company emergency response vehicle outside building' },
  
  // Evidence showing landlord responsiveness differences
  { complaintIndex: 5, description: 'Email from Premium Properties scheduling immediate repair' },
  { complaintIndex: 6, description: 'Work order number provided same day complaint filed' },
  
  // Evidence for Williamsburg lead paint pattern
  { complaintIndex: 13, description: 'Lead test kit showing positive result' },
  { complaintIndex: 14, description: 'Neighbor confirms lead paint in their unit too' },
  { complaintIndex: 15, description: 'Photo of rat droppings throughout kitchen' }
];

async function seedDatabase() {
  try {
    console.log('Seeding Tenant Intelligence System with realistic demo data...');
    console.log('Creating patterns to reveal repeat-offender landlords and neighborhood trends...');
    
    const db = await initializeDatabase();
    const complaintRepo = new ComplaintRepository(db);
    const evidenceRepo = new EvidenceRepository(db);

    // Clear existing data
    console.log('Clearing existing data...');
    await db.run('DELETE FROM evidence');
    await db.run('DELETE FROM status_history');
    await db.run('DELETE FROM complaints');

    // Insert demo complaints with strategic timing
    console.log('Inserting strategic complaint data...');
    const createdComplaints = [];
    
    for (let i = 0; i < demoComplaints.length; i++) {
      const complaint = demoComplaints[i];
      const created = await complaintRepo.create(complaint);
      createdComplaints.push(created);
      
      // Add some age variation to complaints (simulate complaints over time)
      if (i < 10) {
        // Older complaints (30-90 days ago)
        const daysAgo = 30 + Math.floor(Math.random() * 60);
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - daysAgo);
        await db.run(
          'UPDATE complaints SET created_at = ?, updated_at = ? WHERE id = ?',
          [oldDate.toISOString(), oldDate.toISOString(), created.id]
        );
      } else if (i < 20) {
        // Recent complaints (1-30 days ago)
        const daysAgo = 1 + Math.floor(Math.random() * 29);
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - daysAgo);
        await db.run(
          'UPDATE complaints SET created_at = ?, updated_at = ? WHERE id = ?',
          [recentDate.toISOString(), recentDate.toISOString(), created.id]
        );
      }
      // Rest are very recent (today)
      
      console.log(`  - Created complaint: ${created.category} at ${complaint.buildingAddress.split(',')[0]} (${complaint.landlordInfo?.name})`);
    }

    // Strategic status updates to show landlord response patterns
    console.log('Setting complaint statuses to reveal landlord patterns...');
    
    // Premium Properties (good landlord) - quick resolutions
    const premiumComplaints = createdComplaints.filter(c => 
      c.landlordInfo?.name === 'Premium Properties Inc'
    );
    for (const complaint of premiumComplaints) {
      if (Math.random() > 0.3) { // 70% resolved
        await complaintRepo.updateStatus({
          complaintId: complaint.id,
          newStatus: ComplaintStatus.RESOLVED,
          notes: 'Maintenance completed promptly. Professional service.'
        });
      } else {
        await complaintRepo.updateStatus({
          complaintId: complaint.id,
          newStatus: ComplaintStatus.UNDER_REVIEW,
          notes: 'Work order issued. Repair scheduled within 48 hours.'
        });
      }
    }

    // Slumlord Properties - mostly ignored or dismissed
    const slumlordComplaints = createdComplaints.filter(c => 
      c.landlordInfo?.name === 'Slumlord Properties LLC'
    );
    for (let i = 0; i < slumlordComplaints.length; i++) {
      const complaint = slumlordComplaints[i];
      if (i === 0) {
        // One dismissed to show bad faith
        await complaintRepo.updateStatus({
          complaintId: complaint.id,
          newStatus: ComplaintStatus.DISMISSED,
          notes: 'Tenant responsible for heating costs per lease.'
        });
      } else if (i === 1) {
        // One "under review" but very old
        await complaintRepo.updateStatus({
          complaintId: complaint.id,
          newStatus: ComplaintStatus.UNDER_REVIEW,
          notes: 'Investigating. Please be patient.'
        });
      }
      // Rest remain "Reported" (ignored)
    }

    // Queens Residential LLC - safety issues mostly ignored
    const queensComplaints = createdComplaints.filter(c => 
      c.landlordInfo?.name === 'Queens Residential LLC'
    );
    for (const complaint of queensComplaints) {
      if (complaint.category === IssueCategory.SAFETY) {
        // Safety issues ignored - very bad pattern
        // Leave as "Reported"
      }
    }

    // Brooklyn Housing Corp - mixed response
    const brooklynComplaints = createdComplaints.filter(c => 
      c.landlordInfo?.name === 'Brooklyn Housing Corp'
    );
    for (let i = 0; i < brooklynComplaints.length; i++) {
      if (i % 2 === 0) {
        await complaintRepo.updateStatus({
          complaintId: brooklynComplaints[i].id,
          newStatus: ComplaintStatus.UNDER_REVIEW,
          notes: 'Maintenance team notified.'
        });
      }
    }

    // Add strategic upvotes to show community verification
    console.log('Adding community upvotes to show verification patterns...');
    
    // High upvotes for serious safety issues
    const safetyComplaints = createdComplaints.filter(c => c.category === IssueCategory.SAFETY);
    const upvoteRepo = new UpvoteRepository(db);
    
    for (const complaint of safetyComplaints) {
      const upvotes = 3 + Math.floor(Math.random() * 8); // 3-10 upvotes
      for (let i = 0; i < upvotes; i++) {
        const sessionId = `demo-session-${complaint.id}-${i}`;
        await upvoteRepo.addUpvote(complaint.id, sessionId);
      }
    }

    // Medium upvotes for utilities issues
    const utilityComplaints = createdComplaints.filter(c => c.category === IssueCategory.UTILITIES);
    for (const complaint of utilityComplaints) {
      const upvotes = 1 + Math.floor(Math.random() * 5); // 1-5 upvotes
      for (let i = 0; i < upvotes; i++) {
        const sessionId = `demo-session-${complaint.id}-${i}`;
        await upvoteRepo.addUpvote(complaint.id, sessionId);
      }
    }

    // Lower upvotes for maintenance issues
    const maintenanceComplaints = createdComplaints.filter(c => c.category === IssueCategory.MAINTENANCE);
    for (const complaint of maintenanceComplaints) {
      if (Math.random() > 0.3) { // 70% get some upvotes
        const upvotes = 1 + Math.floor(Math.random() * 3); // 1-3 upvotes
        for (let i = 0; i < upvotes; i++) {
          const sessionId = `demo-session-${complaint.id}-${i}`;
          await upvoteRepo.addUpvote(complaint.id, sessionId);
        }
      }
    }

    // Insert strategic evidence
    console.log('Adding evidence to support community verification...');
    for (const evidence of demoEvidence) {
      if (evidence.complaintIndex < createdComplaints.length) {
        const created = await evidenceRepo.create({
          complaintId: createdComplaints[evidence.complaintIndex].id,
          description: evidence.description
        });
        console.log(`  - Added evidence: ${evidence.description.substring(0, 50)}...`);
      }
    }

    // Display comprehensive summary showing patterns
    console.log('\n🎯 DEMO DATA PATTERNS CREATED:');
    console.log('=====================================');
    
    // Landlord analysis
    const landlordStats = new Map();
    for (const complaint of createdComplaints) {
      const landlord = complaint.landlordInfo?.name || 'Unknown';
      if (!landlordStats.has(landlord)) {
        landlordStats.set(landlord, { total: 0, resolved: 0, safety: 0, utilities: 0 });
      }
      const stats = landlordStats.get(landlord);
      stats.total++;
      if (complaint.status === ComplaintStatus.RESOLVED) stats.resolved++;
      if (complaint.category === IssueCategory.SAFETY) stats.safety++;
      if (complaint.category === IssueCategory.UTILITIES) stats.utilities++;
    }

    console.log('\n🏢 LANDLORD PATTERNS:');
    for (const [landlord, stats] of landlordStats.entries()) {
      const resolutionRate = ((stats.resolved / stats.total) * 100).toFixed(1);
      console.log(`  ${landlord}:`);
      console.log(`    - Total complaints: ${stats.total}`);
      console.log(`    - Resolution rate: ${resolutionRate}%`);
      console.log(`    - Safety issues: ${stats.safety}`);
      console.log(`    - Utility issues: ${stats.utilities}`);
    }

    // Neighborhood analysis
    const neighborhoods = new Map();
    for (const complaint of createdComplaints) {
      const area = complaint.buildingAddress.includes('Broadway') ? 'Downtown' :
                   complaint.buildingAddress.includes('Riverside') ? 'Riverside Heights' :
                   complaint.buildingAddress.includes('St. Marks') ? 'East Village' :
                   complaint.buildingAddress.includes('Montague') ? 'Brooklyn Heights' :
                   complaint.buildingAddress.includes('Bedford') ? 'Williamsburg' :
                   complaint.buildingAddress.includes('Northern') ? 'Queens Village' :
                   complaint.buildingAddress.includes('Steinway') ? 'Astoria' :
                   complaint.buildingAddress.includes('Grand Concourse') ? 'Bronx South' : 'Other';
      
      if (!neighborhoods.has(area)) {
        neighborhoods.set(area, { total: 0, safety: 0, unresolved: 0 });
      }
      const stats = neighborhoods.get(area);
      stats.total++;
      if (complaint.category === IssueCategory.SAFETY) stats.safety++;
      if (complaint.status === ComplaintStatus.REPORTED) stats.unresolved++;
    }

    console.log('\n🏘️ NEIGHBORHOOD TRENDS:');
    for (const [area, stats] of neighborhoods.entries()) {
      console.log(`  ${area}:`);
      console.log(`    - Total complaints: ${stats.total}`);
      console.log(`    - Safety issues: ${stats.safety}`);
      console.log(`    - Unresolved: ${stats.unresolved}`);
    }

    const overallStats = await complaintRepo.getStatistics();
    const evidenceStats = await evidenceRepo.getStatistics();
    
    console.log('\n📊 OVERALL STATISTICS:');
    console.log(`  - Total complaints: ${overallStats.total}`);
    console.log(`  - Total evidence: ${evidenceStats.totalEvidence}`);
    console.log(`  - By category:`);
    Object.entries(overallStats.byCategory).forEach(([category, count]) => {
      console.log(`    - ${category}: ${count}`);
    });
    console.log(`  - By status:`);
    Object.entries(overallStats.byStatus).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`);
    });

    console.log('\n✅ KEY PATTERNS TO DEMONSTRATE:');
    console.log('  🔴 Slumlord Properties LLC: 6 complaints, 0% resolution rate');
    console.log('  🟢 Premium Properties Inc: High resolution rate, responsive');
    console.log('  🟡 Brooklyn Housing Corp: Mixed performance');
    console.log('  🔴 Queens Residential LLC: Multiple safety violations ignored');
    console.log('  📍 Downtown District: Concentration of utility/safety issues');
    console.log('  📍 Williamsburg: Lead paint pattern across multiple buildings');

    await closeDatabase();
    console.log('\n🎉 Realistic demo data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase, demoComplaints, demoEvidence };