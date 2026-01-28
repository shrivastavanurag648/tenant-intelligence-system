/**
 * Demo analysis script to showcase patterns in the data
 * Run this to see clear patterns for demo presentations
 */

import { initializeDatabase, closeDatabase } from './connection';
import { ComplaintRepository } from './complaints';
import { IssueCategory, ComplaintStatus } from '../../../shared/src/types';

async function analyzeDemoPatterns() {
  try {
    console.log('🎯 TENANT INTELLIGENCE SYSTEM - DEMO ANALYSIS');
    console.log('='.repeat(60));
    
    const db = await initializeDatabase();
    const complaintRepo = new ComplaintRepository(db);

    // Get all complaints
    const allComplaints = await complaintRepo.findMany({ limit: 100 });
    
    console.log('\n🏢 REPEAT OFFENDER LANDLORDS:');
    console.log('-'.repeat(40));
    
    // Analyze landlord patterns
    const landlordAnalysis = new Map();
    
    for (const complaint of allComplaints) {
      const landlord = complaint.landlordInfo?.name || 'Unknown';
      if (!landlordAnalysis.has(landlord)) {
        landlordAnalysis.set(landlord, {
          total: 0,
          resolved: 0,
          safety: 0,
          utilities: 0,
          sanitation: 0,
          maintenance: 0,
          buildings: new Set(),
          avgUpvotes: 0,
          totalUpvotes: 0
        });
      }
      
      const analysis = landlordAnalysis.get(landlord);
      analysis.total++;
      analysis.totalUpvotes += complaint.upvotes;
      
      if (complaint.status === ComplaintStatus.RESOLVED) analysis.resolved++;
      if (complaint.category === IssueCategory.SAFETY) analysis.safety++;
      if (complaint.category === IssueCategory.UTILITIES) analysis.utilities++;
      if (complaint.category === IssueCategory.SANITATION) analysis.sanitation++;
      if (complaint.category === IssueCategory.MAINTENANCE) analysis.maintenance++;
      
      // Extract building address (first part before comma)
      const building = complaint.buildingAddress.split(',')[0];
      analysis.buildings.add(building);
    }

    // Calculate averages and sort by severity
    const landlordResults = Array.from(landlordAnalysis.entries()).map(([name, data]) => ({
      name,
      ...data,
      avgUpvotes: data.total > 0 ? (data.totalUpvotes / data.total).toFixed(1) : '0',
      resolutionRate: ((data.resolved / data.total) * 100).toFixed(1),
      buildingCount: data.buildings.size,
      severityScore: (data.safety * 3) + (data.utilities * 2) + data.sanitation + (data.maintenance * 0.5)
    })).sort((a, b) => b.severityScore - a.severityScore);

    for (const landlord of landlordResults) {
      const status = landlord.resolutionRate === '0.0' && landlord.total > 3 ? '🔴 PROBLEM LANDLORD' :
                     parseFloat(landlord.resolutionRate) > 70 ? '🟢 RESPONSIVE' :
                     parseFloat(landlord.resolutionRate) > 30 ? '🟡 MIXED RECORD' : '🟠 POOR RESPONSE';
      
      console.log(`\n${status}: ${landlord.name}`);
      console.log(`  📊 ${landlord.total} complaints across ${landlord.buildingCount} buildings`);
      console.log(`  ✅ ${landlord.resolutionRate}% resolution rate`);
      console.log(`  ⚠️  ${landlord.safety} safety issues, ${landlord.utilities} utility problems`);
      console.log(`  👥 ${landlord.avgUpvotes} avg community upvotes per complaint`);
    }

    console.log('\n🏘️ NEIGHBORHOOD PROBLEM AREAS:');
    console.log('-'.repeat(40));
    
    // Analyze neighborhood patterns
    const neighborhoodAnalysis = new Map();
    
    for (const complaint of allComplaints) {
      const neighborhood = complaint.buildingAddress.includes('Broadway') ? 'Downtown District' :
                          complaint.buildingAddress.includes('Riverside') ? 'Riverside Heights' :
                          complaint.buildingAddress.includes('St. Marks') ? 'East Village' :
                          complaint.buildingAddress.includes('Montague') ? 'Brooklyn Heights' :
                          complaint.buildingAddress.includes('Bedford') ? 'Williamsburg' :
                          complaint.buildingAddress.includes('Northern') ? 'Queens Village' :
                          complaint.buildingAddress.includes('Steinway') ? 'Astoria' :
                          complaint.buildingAddress.includes('Grand Concourse') ? 'Bronx South' : 'Other';
      
      if (!neighborhoodAnalysis.has(neighborhood)) {
        neighborhoodAnalysis.set(neighborhood, {
          total: 0,
          safety: 0,
          utilities: 0,
          unresolved: 0,
          avgUpvotes: 0,
          totalUpvotes: 0,
          buildings: new Set()
        });
      }
      
      const analysis = neighborhoodAnalysis.get(neighborhood);
      analysis.total++;
      analysis.totalUpvotes += complaint.upvotes;
      
      if (complaint.category === IssueCategory.SAFETY) analysis.safety++;
      if (complaint.category === IssueCategory.UTILITIES) analysis.utilities++;
      if (complaint.status === ComplaintStatus.REPORTED) analysis.unresolved++;
      
      const building = complaint.buildingAddress.split(',')[0];
      analysis.buildings.add(building);
    }

    const neighborhoodResults = Array.from(neighborhoodAnalysis.entries()).map(([name, data]) => ({
      name,
      ...data,
      avgUpvotes: data.total > 0 ? (data.totalUpvotes / data.total).toFixed(1) : '0',
      unresolvedRate: ((data.unresolved / data.total) * 100).toFixed(1),
      buildingCount: data.buildings.size,
      riskScore: (data.safety * 2) + data.utilities + (data.unresolved * 0.5)
    })).sort((a, b) => b.riskScore - a.riskScore);

    for (const area of neighborhoodResults) {
      const riskLevel = area.riskScore > 8 ? '🔴 HIGH RISK' :
                       area.riskScore > 5 ? '🟡 MODERATE RISK' :
                       area.riskScore > 2 ? '🟢 LOW RISK' : '✅ MINIMAL ISSUES';
      
      console.log(`\n${riskLevel}: ${area.name}`);
      console.log(`  🏢 ${area.total} complaints across ${area.buildingCount} buildings`);
      console.log(`  ⚠️  ${area.safety} safety violations, ${area.utilities} utility failures`);
      console.log(`  📋 ${area.unresolvedRate}% unresolved complaints`);
      console.log(`  👥 ${area.avgUpvotes} avg community support per complaint`);
    }

    console.log('\n🔍 BUILDING-SPECIFIC HOTSPOTS:');
    console.log('-'.repeat(40));
    
    // Find buildings with multiple complaints
    const buildingAnalysis = new Map();
    
    for (const complaint of allComplaints) {
      const building = complaint.buildingAddress.split(',')[0];
      if (!buildingAnalysis.has(building)) {
        buildingAnalysis.set(building, {
          complaints: [],
          categories: new Set(),
          totalUpvotes: 0,
          unresolved: 0,
          landlord: complaint.landlordInfo?.name || 'Unknown'
        });
      }
      
      const analysis = buildingAnalysis.get(building);
      analysis.complaints.push(complaint);
      analysis.categories.add(complaint.category);
      analysis.totalUpvotes += complaint.upvotes;
      if (complaint.status === ComplaintStatus.REPORTED) analysis.unresolved++;
    }

    const problemBuildings = Array.from(buildingAnalysis.entries())
      .filter(([_, data]) => data.complaints.length > 1)
      .map(([building, data]) => ({
        building,
        count: data.complaints.length,
        categories: Array.from(data.categories),
        totalUpvotes: data.totalUpvotes,
        unresolved: data.unresolved,
        landlord: data.landlord,
        riskScore: data.unresolved * 2 + data.categories.size
      }))
      .sort((a, b) => b.riskScore - a.riskScore);

    for (const building of problemBuildings.slice(0, 8)) {
      console.log(`\n🏢 ${building.building}`);
      console.log(`  🏠 Landlord: ${building.landlord}`);
      console.log(`  📊 ${building.count} complaints (${building.unresolved} unresolved)`);
      console.log(`  🏷️  Categories: ${building.categories.join(', ')}`);
      console.log(`  👥 ${building.totalUpvotes} total community upvotes`);
    }

    console.log('\n📈 TRENDING ISSUES:');
    console.log('-'.repeat(40));
    
    // Most upvoted complaints (trending)
    const trending = allComplaints
      .filter(c => c.upvotes > 2)
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 5);

    for (const complaint of trending) {
      console.log(`\n🔥 ${complaint.upvotes} upvotes - ${complaint.category}`);
      console.log(`  📍 ${complaint.buildingAddress.split(',')[0]}`);
      console.log(`  🏠 ${complaint.landlordInfo?.name || 'Unknown landlord'}`);
      console.log(`  📝 ${complaint.description.substring(0, 80)}...`);
      console.log(`  📅 Status: ${complaint.status}`);
    }

    console.log('\n🎯 KEY DEMO INSIGHTS:');
    console.log('='.repeat(60));
    console.log('✅ Clear patterns of repeat-offender landlords');
    console.log('✅ Geographic clustering of issues by neighborhood');
    console.log('✅ Building-specific hotspots with multiple complaints');
    console.log('✅ Community verification through upvotes and evidence');
    console.log('✅ Visible contrast between responsive vs negligent landlords');
    console.log('✅ Safety issues concentrated in specific areas');
    console.log('✅ Utility problems showing systemic building maintenance issues');

    await closeDatabase();
    
  } catch (error) {
    console.error('Error analyzing demo patterns:', error);
    process.exit(1);
  }
}

// Run analysis if this script is executed directly
if (require.main === module) {
  analyzeDemoPatterns();
}

export { analyzeDemoPatterns };