# Implementation Plan: Tenant Intelligence System

## Overview

This implementation plan converts the demo-ready tenant intelligence system design into discrete coding tasks. The approach prioritizes core functionality for hackathon demonstrations, using TypeScript with React frontend, Express.js backend, and SQLite database. Each task builds incrementally toward a working prototype that can be built and demoed quickly.

## Tasks

- [x] 1. Set up project structure and development environment
  - Create TypeScript project with React frontend and Express.js backend
  - Set up testing framework with Jest and fast-check for property-based testing
  - Configure build tools, ESLint, and development scripts
  - Create basic project structure with client/, server/, and shared/ directories
  - _Requirements: Foundation for all system components_

- [ ] 2. Create core data models and database setup
  - [x] 2.1 Define TypeScript interfaces and enums
    - Create Complaint, Evidence, BuildingProfile, LandlordProfile interfaces
    - Define IssueCategory and ComplaintStatus enums
    - Add validation schemas using Zod library
    - _Requirements: 1.2, 2.2, 3.1_
  
  - [ ]* 2.2 Write property test for data collection scope
    - **Property 1: Comprehensive Data Collection and Storage**
    - **Validates: Requirements 1.2, 1.3, 1.4**
  
  - [x] 2.3 Set up SQLite database and schema
    - Create database schema for complaints, evidence, and status_history tables
    - Set up database connection and basic CRUD operations
    - Add database initialization and migration scripts
    - _Requirements: 7.1_
  
  - [ ]* 2.4 Write property test for data persistence
    - **Property 9: Data Persistence and Retrieval**
    - **Validates: Requirements 7.1, 7.3**

- [x] 3. Implement complaint submission system
  - [x] 3.1 Create complaint submission API endpoint
    - Build POST /api/complaints endpoint with input validation
    - Implement random ID generation for complaint tracking
    - Add basic input sanitization and validation
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [x] 3.2 Add file upload handling for images
    - Implement image upload with format validation (JPG, PNG, WebP)
    - Add file size limits and secure storage
    - Create image preview functionality
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
  
  - [ ]* 3.3 Write property test for file handling
    - **Property 11: Comprehensive File Handling**
    - **Validates: Requirements 8.1, 8.2, 8.4, 8.5**

- [x] 4. Build AI classification system
  - [x] 4.1 Implement simple text classification
    - Create keyword-based classifier for Safety, Maintenance, Sanitation, Utilities
    - Add confidence scoring and fallback to manual selection
    - Integrate classification into complaint submission workflow
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [ ]* 4.2 Write property test for AI classification
    - **Property 2: Complete AI Classification Workflow**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
  
  - [x] 4.3 Add manual category override functionality
    - Allow users to manually select category when AI confidence is low
    - Store both AI-assigned and user-confirmed categories
    - _Requirements: 2.4, 2.5_
  
  - [ ]* 4.4 Write property test for classification confidence handling
    - **Property 13: Classification Confidence Handling**
    - **Validates: Requirements 2.4**

- [x] 5. Implement complaint lifecycle management
  - [x] 5.1 Create status management system
    - Implement status transitions (Reported → Under Review → Resolved/Dismissed)
    - Add status history tracking with timestamps
    - Create API endpoints for status updates
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ]* 5.2 Write property test for status lifecycle
    - **Property 3: Status Lifecycle Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.5**
  
  - [x] 5.3 Add resolution notes functionality
    - Allow optional notes when resolving complaints
    - Store resolution information with status changes
    - _Requirements: 3.4_
  
  - [ ]* 5.4 Write property test for resolution notes
    - **Property 14: Resolution Notes Functionality**
    - **Validates: Requirements 3.4**

- [x] 6. Checkpoint - Core backend functionality validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Build community verification system
  - [x] 7.1 Implement anonymous upvoting
    - Create upvote API endpoint with session-based deduplication
    - Add upvote count tracking and display
    - Prevent multiple votes from same browser session
    - _Requirements: 4.1, 4.5_
  
  - [ ]* 7.2 Write property test for community verification
    - **Property 4: Community Verification Integrity**
    - **Validates: Requirements 4.1, 4.3, 4.5**
  
  - [x] 7.3 Add evidence submission system
    - Create evidence submission API with text and optional images
    - Link evidence to original complaints
    - Display evidence in complaint views
    - _Requirements: 4.2, 4.4_
  
  - [ ]* 7.4 Write property test for evidence linking
    - **Property 5: Evidence Linking Consistency**
    - **Validates: Requirements 4.2, 4.4**

- [x] 8. Create building and landlord profile system
  - [x] 8.1 Implement building profile aggregation
    - Group complaints by building address
    - Calculate complaint counts by category and status
    - Generate building profile data with statistics
    - _Requirements: 5.1, 5.2_
  
  - [x] 8.2 Add landlord profile functionality
    - Create landlord profiles across multiple properties
    - Aggregate complaint data for landlord analysis
    - Calculate trends and resolution statistics
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [ ]* 8.3 Write property test for profile aggregation
    - **Property 6: Profile Aggregation Accuracy**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ]* 8.4 Write property test for statistical calculations
    - **Property 7: Statistical Calculation Correctness**
    - **Validates: Requirements 5.4, 5.5**

- [x] 9. Build React frontend interface
  - [x] 9.1 Create complaint submission form
    - Build responsive form with text input and image upload
    - Add real-time validation and user feedback
    - Implement category selection with AI suggestions
    - _Requirements: 1.1, 1.5, 6.5_
  
  - [ ]* 9.2 Write property test for responsive design
    - **Property 8: Responsive Design Functionality**
    - **Validates: Requirements 6.5**
  
  - [x] 9.3 Create complaint listing and detail views
    - Build complaint list with sorting and filtering
    - Add detailed complaint view with status and evidence
    - Implement upvoting and evidence submission UI
    - _Requirements: 3.3, 4.3, 7.4_
  
  - [ ]* 9.4 Write property test for list operations
    - **Property 10: List Operations Consistency**
    - **Validates: Requirements 7.4**

- [x] 10. Implement profile and analytics views
  - [x] 10.1 Create building profile pages
    - Display building complaint statistics and trends
    - Show complaint breakdown by category and status
    - Add visual charts for data representation
    - _Requirements: 5.2, 5.4_
  
  - [x] 10.2 Build landlord profile interface
    - Show landlord information across properties
    - Display complaint patterns and resolution rates
    - Add trend analysis and comparison features
    - _Requirements: 5.3, 5.5_
  
  - [x] 10.3 Add image display functionality
    - Implement user-friendly image viewing in complaints
    - Add image galleries for evidence submissions
    - Ensure proper image loading and error handling
    - _Requirements: 8.3_
  
  - [ ]* 10.4 Write property test for image display
    - **Property 12: Image Display Consistency**
    - **Validates: Requirements 8.3**

- [x] 11. Integration and API wiring
  - [x] 11.1 Connect frontend to backend APIs
    - Wire React components to Express.js endpoints
    - Add error handling and loading states
    - Implement proper data flow for all user interactions
    - _Requirements: All system integration_
  
  - [x] 11.2 Add status and timestamp display
    - Show current complaint status in all views
    - Display last update timestamps accurately
    - Add status change history visualization
    - _Requirements: 3.3_
  
  - [ ]* 11.3 Write property test for status display
    - **Property 15: Status and Timestamp Display**
    - **Validates: Requirements 3.3**
  
  - [ ]* 11.4 Write integration tests for complete workflows
    - Test end-to-end complaint submission and display
    - Verify community verification workflows
    - Test profile generation and data aggregation

- [x] 12. Final polish and demo preparation
  - [x] 12.1 Add demo data and seed scripts
    - Create sample complaints for demonstration
    - Add realistic building and landlord data
    - Implement data seeding for quick demo setup
    - _Requirements: Demo preparation_
  
  - [x] 12.2 Optimize for demo presentation
    - Add loading indicators and smooth transitions
    - Implement basic error handling and user feedback
    - Create simple navigation and user guidance
    - _Requirements: 6.2, 6.3_
  
  - [x] 12.3 Create deployment configuration
    - Set up build scripts for production deployment
    - Add environment configuration for different stages
    - Create simple deployment documentation
    - _Requirements: Demo deployment_

- [x] 13. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Focus on working demo functionality rather than enterprise features
- Property tests use fast-check library with minimum 100 iterations
- Checkpoints ensure incremental validation of core functionality
- SQLite database provides simple setup for hackathon demonstrations
- Basic AI classification can use keyword matching for quick implementation