/**
 * AI Classification Service for Tenant Intelligence System
 * 
 * Implements simple keyword-based classification for complaint categorization
 * with confidence scoring and fallback to manual selection.
 */

import { IssueCategory, ClassificationResult, TrainingExample } from '../../../shared/src/types';

export interface AIClassifier {
  classifyComplaint(text: string): ClassificationResult;
  getConfidenceScore(text: string, category: IssueCategory): number;
  isConfidenceHigh(confidence: number): boolean;
  trainModel?(trainingData: TrainingExample[]): void;
}

/**
 * Simple keyword-based classifier for demo purposes
 */
export class KeywordClassifier implements AIClassifier {
  private readonly categoryKeywords: Record<IssueCategory, string[]> = {
    [IssueCategory.SAFETY]: [
      'unsafe', 'danger', 'hazard', 'fire', 'smoke', 'carbon monoxide', 'gas leak',
      'broken stairs', 'loose railing', 'exposed wire', 'electrical hazard',
      'asbestos', 'lead paint', 'security', 'break in', 'broken lock',
      'violence', 'threat', 'assault', 'emergency', 'injury', 'accident',
      'slip', 'fall', 'trip', 'sharp', 'glass', 'needle', 'weapon',
      'fire hazard', 'safety hazard', 'dangerous'
    ],
    [IssueCategory.MAINTENANCE]: [
      'repair', 'broken', 'fix', 'maintenance', 'replace', 'install',
      'door', 'window', 'roof', 'ceiling', 'floor', 'wall', 'paint',
      'crack', 'hole', 'damage', 'worn', 'old', 'deteriorate',
      'appliance', 'refrigerator', 'stove', 'oven', 'dishwasher',
      'cabinet', 'counter', 'sink', 'faucet', 'fixture', 'hardware',
      'squeaky', 'stuck', 'loose', 'wobbly', 'unstable', 'handle'
    ],
    [IssueCategory.SANITATION]: [
      'dirty', 'filthy', 'unclean', 'unsanitary', 'hygiene', 'smell', 'odor',
      'garbage', 'trash', 'waste', 'pest', 'rodent', 'mouse', 'rat',
      'cockroach', 'bug', 'insect', 'ant', 'flea', 'bed bug',
      'mold', 'mildew', 'fungus', 'bacteria', 'contamination',
      'sewage', 'toilet', 'bathroom', 'shower', 'drain', 'clog',
      'overflow', 'backup', 'unsanitary conditions', 'bad odor'
    ],
    [IssueCategory.UTILITIES]: [
      'electricity', 'power', 'electrical', 'outlet', 'switch', 'breaker',
      'blackout', 'outage', 'no power', 'electric bill', 'meter',
      'water', 'plumbing', 'pipe', 'pressure', 'hot water', 'cold water',
      'heating', 'heat', 'furnace', 'boiler', 'radiator', 'thermostat',
      'air conditioning', 'ac', 'cooling', 'ventilation', 'fan',
      'gas', 'natural gas', 'propane', 'internet', 'wifi', 'cable',
      'heating system', 'water pressure', 'no hot water'
    ]
  };

  private readonly confidenceThreshold = 0.3; // Minimum confidence for auto-classification

  /**
   * Classify complaint text into issue categories
   */
  classifyComplaint(text: string): ClassificationResult {
    const normalizedText = this.normalizeText(text);
    const scores = this.calculateCategoryScores(normalizedText);
    
    // Find the category with highest score
    const sortedCategories = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category as IssueCategory);

    const topCategory = sortedCategories[0];
    const confidence = scores[topCategory];

    // Get suggested categories (categories with scores above 0.05, max 3)
    const suggestedCategories = sortedCategories
      .filter(category => scores[category] > 0.05)
      .slice(0, 3);

    return {
      category: topCategory,
      confidence,
      suggestedCategories
    };
  }

  /**
   * Get confidence score for a specific category
   */
  getConfidenceScore(text: string, category: IssueCategory): number {
    const normalizedText = this.normalizeText(text);
    return this.calculateCategoryScore(normalizedText, category);
  }

  /**
   * Check if classification confidence is high enough for auto-assignment
   */
  isConfidenceHigh(confidence: number): boolean {
    return confidence >= this.confidenceThreshold;
  }

  /**
   * Normalize text for analysis
   */
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  /**
   * Calculate scores for all categories
   */
  private calculateCategoryScores(normalizedText: string): Record<IssueCategory, number> {
    const scores = {} as Record<IssueCategory, number>;
    
    for (const category of Object.values(IssueCategory)) {
      scores[category] = this.calculateCategoryScore(normalizedText, category);
    }

    return scores;
  }

  /**
   * Calculate score for a specific category based on keyword matching
   */
  private calculateCategoryScore(normalizedText: string, category: IssueCategory): number {
    const keywords = this.categoryKeywords[category];
    const words = normalizedText.split(' ');
    
    let matchCount = 0;
    let totalWeight = 0;
    const matchedKeywords = new Set<string>();

    for (const keyword of keywords) {
      const keywordWords = keyword.split(' ');
      
      if (keywordWords.length === 1) {
        // Single word keyword
        if (words.includes(keyword)) {
          matchCount++;
          totalWeight += 1;
          matchedKeywords.add(keyword);
        }
      } else {
        // Multi-word keyword (phrase) - give higher weight
        if (normalizedText.includes(keyword)) {
          matchCount++;
          totalWeight += keywordWords.length * 1.5; // Higher weight for phrases
          matchedKeywords.add(keyword);
        }
      }
    }

    if (matchCount === 0) return 0;

    // Calculate confidence based on match density and keyword relevance
    const textLength = words.length;
    const matchDensity = totalWeight / Math.max(textLength, 5); // Avoid division by very small numbers
    const keywordCoverage = matchCount / keywords.length;
    
    // Boost score for category-specific phrases
    let categoryBoost = 1.0;
    if (category === IssueCategory.SAFETY && (
      matchedKeywords.has('gas leak') || 
      matchedKeywords.has('fire hazard') || 
      matchedKeywords.has('safety hazard') ||
      matchedKeywords.has('health hazard') ||
      matchedKeywords.has('carbon monoxide')
    )) {
      categoryBoost = 1.3;
    } else if (category === IssueCategory.UTILITIES && (
      matchedKeywords.has('heating system') ||
      matchedKeywords.has('hot water') ||
      matchedKeywords.has('water pressure') ||
      matchedKeywords.has('no hot water')
    )) {
      categoryBoost = 1.3;
    } else if (category === IssueCategory.SANITATION && (
      matchedKeywords.has('unsanitary conditions') ||
      matchedKeywords.has('bad odor') ||
      matchedKeywords.has('bed bug')
    )) {
      categoryBoost = 1.3;
    }
    
    // Combine metrics with weights
    const confidence = Math.min(1.0, (matchDensity * 0.7 + keywordCoverage * 0.3) * categoryBoost);
    
    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Optional training method for future ML integration
   */
  trainModel?(trainingData: TrainingExample[]): void {
    // For keyword-based classifier, we could use training data to:
    // 1. Extract new keywords from training examples
    // 2. Adjust keyword weights based on effectiveness
    // 3. Build category-specific vocabulary
    
    console.log(`Training with ${trainingData.length} examples (keyword classifier - no training needed)`);
  }
}

/**
 * Factory function to create classifier instance
 */
export function createAIClassifier(): AIClassifier {
  return new KeywordClassifier();
}

/**
 * Singleton instance for application use
 */
export const aiClassifier = createAIClassifier();