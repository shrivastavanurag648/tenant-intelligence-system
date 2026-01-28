/**
 * Demo data validation script
 * Verifies that seeded data creates the expected patterns for demonstration
 */

import { initializeDatabase, closeDatabase } from './connection';
import { ComplaintRepository } from './complaints';
import { EvidenceRepository } from './evidence';
import { ProfileRepository } from './profiles';
import { IssueCategory, ComplaintStatus } from '../../../shared/src/types';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function validateDemoData(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  try {
    const db = await initializeDatabase();
    const complaintRepo = new ComplaintRepository(db);
    const evidenceRepo = new EvidenceRepository(db);
    const profileRepo = new ProfileRepository(db);

    // Test 1: Verify minimum complaint count
    const allComplaints = await complaintRepo.findMany();
    results.push({
      passed: allComplaints.length >= 20,
      message: `Complaint count validation`,
      details: { expected: '>=20', actual: allComplaints.length }
    });

    // Test 2: Verify Slumlord Properties pattern (worst offender)
    const slumlordComplaints = allComplaints.filter((c: any) => 
      c.landlordInfo?.name === 'Slumlord Properties LLC'
    );
    const slumlordResolved = slumlordComplaints.filter((c: any) => 
      c.status === ComplaintStatus.RESOLVED
    ).length;
    
    results.push({
      passed: slumlordComplaints.length >= 5 && slumlordResolved === 0,
      message: `Slumlord Properties pattern validation`,
      details: { 
        complaints: slumlordComplaints.length, 
        resolved: slumlordResolved,
        expectedResolved: 0
      }
    });

    // Test 3: Verify Premium Properties pattern (good landlord)
    const premiumComplaints = allComplaints.filter((c: any) => 
      c.landlordInfo?.name === 'Premium Properties Inc'
    );
    const premiumResolved = premiumComplaints.filter((c: any) => 
      c.status === ComplaintStatus.RESOLVED
    ).length;
    
    results.push({
      passed: premiumComplaints.length >= 2 && premiumResolved >= 1,
      message: `Premium Properties pattern validation`,
      details: { 
        complaints: premiumComplaints.length, 
        resolved: premiumResolved,
        resolutionRate: `${((premiumResolved / premiumComplaints.length) * 100).toFixed(1)}%`
      }
    });

    // Test 4: Verify safety issue concentration
    const safetyComplaints = allComplaints.filter((c: any) => 
      c.category === IssueCategory.SAFETY
    );
    const queensSafetyComplaints = safetyComplaints.filter((c: any) =>
      c.buildingAddress.includes('Northern Boulevard')
    );
    
    results.push({
      passed: safetyComplaints.length >= 6 && queensSafetyComplaints.length >= 3,
      message: `Safety issue concentration validation`,
      details: { 
        totalSafety: safetyComplaints.length,
        queensSafety: queensSafetyComplaints.length
      }
    });

    // Test 5: Verify evidence exists
    const evidenceStats = await evidenceRepo.getStatistics();
    results.push({
      passed: evidenceStats.totalEvidence >= 15,
      message: `Evidence count validation`,
      details: { expected: '>=15', actual: evidenceStats.totalEvidence }
    });

    // Test 6: Verify building profiles work
    const buildingProfile = await profileRepo.getBuildingProfile('1247 Broadway, Apt 3A, New York, NY 10001');
    results.push({
      passed: (buildingProfile?.totalComplaints || 0) >= 2,
      message: `Building profile aggregation validation`,
      details: { 
        address: '1247 Broadway',
        complaints: buildingProfile?.totalComplaints || 0
      }
    });

    // Test 7: Verify landlord profiles work
    const landlordProfile = await profileRepo.getLandlordProfile('Slumlord Properties LLC');
    results.push({
      passed: ((landlordProfile?.totalComplaints || 0) >= 5) && ((landlordProfile?.responseRate || 0) === 0),
      message: `Landlord profile aggregation validation`,
      details: { 
        landlord: 'Slumlord Properties LLC',
        complaints: landlordProfile?.totalComplaints || 0,
        responseRate: `${landlordProfile?.responseRate || 0}%`
      }
    });

    // Test 8: Verify category distribution
    const categoryStats = allComplaints.reduce((acc: any, complaint: any) => {
      acc[complaint.category] = (acc[complaint.category] || 0) + 1;
      return acc;
    }, {} as Record<IssueCategory, number>);
    
    const hasAllCategories = Object.values(IssueCategory).every(category => 
      categoryStats[category] > 0
    );
    
    results.push({
      passed: hasAllCategories,
      message: `Category distribution validation`,
      details: categoryStats
    });

    // Test 9: Verify upvote patterns
    const complaintsWithUpvotes = allComplaints.filter((c: any) => c.upvotes > 0);
    const safetyUpvotes = safetyComplaints.reduce((sum: number, c: any) => sum + c.upvotes, 0);
    
    results.push({
      passed: complaintsWithUpvotes.length >= 10 && safetyUpvotes >= 20,
      message: `Upvote pattern validation`,
      details: { 
        complaintsWithUpvotes: complaintsWithUpvotes.length,
        safetyUpvotes: safetyUpvotes
      }
    });

    await closeDatabase();
    
  } catch (error) {
    results.push({
      passed: false,
      message: `Database validation error: ${error}`,
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }

  return results;
}

async function runValidation() {
  console.log('🔍 Validating demo data patterns...\n');
  
  const results = await validateDemoData();
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log();
  });
  
  console.log(`📊 Validation Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All demo data patterns validated successfully!');
    console.log('🚀 System is ready for demonstration');
  } else {
    console.log('⚠️ Some validation tests failed');
    console.log('💡 Consider re-running: npm run demo:seed');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation();
}

export { validateDemoData };