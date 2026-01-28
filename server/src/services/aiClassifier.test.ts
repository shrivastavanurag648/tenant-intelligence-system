/**
 * Unit tests for AI Classification Service
 */

import { KeywordClassifier, createAIClassifier } from './aiClassifier';
import { IssueCategory } from '../../../shared/src/types';

describe('AI Classification Service', () => {
  let classifier: KeywordClassifier;

  beforeEach(() => {
    classifier = new KeywordClassifier();
  });

  describe('Safety Classification', () => {
    it('should classify safety-related complaints correctly', () => {
      const safetyTexts = [
        'There is a gas leak in my apartment and it smells dangerous',
        'The fire alarm has been broken for months and poses a safety hazard',
        'Exposed electrical wires in the hallway create a dangerous situation',
        'The staircase railing is loose and someone could fall and get injured',
        'There is mold growing on the walls which is a health hazard'
      ];

      safetyTexts.forEach(text => {
        const result = classifier.classifyComplaint(text);
        // Debug output
        console.log(`Text: "${text}"`);
        console.log(`Category: ${result.category}, Confidence: ${result.confidence}`);
        console.log(`Suggested: ${result.suggestedCategories.join(', ')}`);
        
        expect(result.category).toBe(IssueCategory.SAFETY);
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.suggestedCategories).toContain(IssueCategory.SAFETY);
      });
    });

    it('should have high confidence for clear safety issues', () => {
      const text = 'Gas leak emergency - dangerous fumes and fire hazard in apartment';
      const result = classifier.classifyComplaint(text);
      
      expect(result.category).toBe(IssueCategory.SAFETY);
      expect(classifier.isConfidenceHigh(result.confidence)).toBe(true);
    });
  });

  describe('Maintenance Classification', () => {
    it('should classify maintenance-related complaints correctly', () => {
      const maintenanceTexts = [
        'The door handle is broken and needs to be repaired',
        'Window won\'t close properly and needs fixing',
        'Kitchen cabinet door is falling off its hinges',
        'The ceiling has cracks that need repair work',
        'Refrigerator stopped working and needs replacement'
      ];

      maintenanceTexts.forEach(text => {
        const result = classifier.classifyComplaint(text);
        expect(result.category).toBe(IssueCategory.MAINTENANCE);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('Sanitation Classification', () => {
    it('should classify sanitation-related complaints correctly', () => {
      const sanitationText = 'There are cockroaches and other pests creating unsanitary conditions';
      const result = classifier.classifyComplaint(sanitationText);
      
      expect(result.category).toBe(IssueCategory.SANITATION);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Utilities Classification', () => {
    it('should classify utilities-related complaints correctly', () => {
      const utilitiesTexts = [
        'No hot water for the past three days',
        'Electricity keeps going out in my apartment',
        'Heating system is not working and it\'s freezing cold',
        'Air conditioning unit broke down during summer',
        'Water pressure is extremely low in all faucets'
      ];

      utilitiesTexts.forEach(text => {
        const result = classifier.classifyComplaint(text);
        expect(result.category).toBe(IssueCategory.UTILITIES);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('Confidence Scoring', () => {
    it('should return higher confidence for texts with multiple relevant keywords', () => {
      const highConfidenceText = 'Broken heating system with no hot water and electrical problems';
      const lowConfidenceText = 'There is an issue with something in my apartment';

      const highResult = classifier.classifyComplaint(highConfidenceText);
      const lowResult = classifier.classifyComplaint(lowConfidenceText);

      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });

    it('should provide suggested categories for ambiguous texts', () => {
      const ambiguousText = 'Water leak caused electrical problems and created unsafe conditions';
      const result = classifier.classifyComplaint(ambiguousText);

      expect(result.suggestedCategories.length).toBeGreaterThan(1);
      // Should include utilities (water, electrical) and safety (unsafe)
      expect(result.suggestedCategories).toContain(IssueCategory.UTILITIES);
    });

    it('should handle empty or very short text gracefully', () => {
      const emptyResult = classifier.classifyComplaint('');
      const shortResult = classifier.classifyComplaint('help');

      expect(emptyResult.confidence).toBe(0);
      expect(shortResult.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getConfidenceScore method', () => {
    it('should return specific confidence score for a category', () => {
      const text = 'Gas leak emergency with fire hazard';
      
      const safetyScore = classifier.getConfidenceScore(text, IssueCategory.SAFETY);
      const maintenanceScore = classifier.getConfidenceScore(text, IssueCategory.MAINTENANCE);

      expect(safetyScore).toBeGreaterThan(maintenanceScore);
      expect(safetyScore).toBeGreaterThan(0);
    });
  });

  describe('Factory Function', () => {
    it('should create a classifier instance', () => {
      const instance = createAIClassifier();
      expect(instance).toBeDefined();
      expect(typeof instance.classifyComplaint).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters and punctuation', () => {
      const text = 'Help!!! The gas is leaking & it\'s very dangerous!!!';
      const result = classifier.classifyComplaint(text);

      expect(result.category).toBe(IssueCategory.SAFETY);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should be case insensitive', () => {
      const upperText = 'GAS LEAK EMERGENCY';
      const lowerText = 'gas leak emergency';
      const mixedText = 'Gas Leak Emergency';

      const upperResult = classifier.classifyComplaint(upperText);
      const lowerResult = classifier.classifyComplaint(lowerText);
      const mixedResult = classifier.classifyComplaint(mixedText);

      expect(upperResult.category).toBe(lowerResult.category);
      expect(lowerResult.category).toBe(mixedResult.category);
      expect(upperResult.category).toBe(IssueCategory.SAFETY);
    });

    it('should handle multi-word keywords correctly', () => {
      const text = 'Carbon monoxide detector is not working';
      const result = classifier.classifyComplaint(text);

      expect(result.category).toBe(IssueCategory.SAFETY);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});