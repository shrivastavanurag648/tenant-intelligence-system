/**
 * Complaint submission and management API routes
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { ComplaintRepository } from '../database/complaints';
import { UpvoteRepository } from '../database/upvotes';
import { getDatabase } from '../database/connection';
import { 
  ComplaintSubmissionSchema, 
  ComplaintFiltersSchema,
  ComplaintIdParamSchema,
  ImageFileSchema,
  IssueCategorySchema,
  StatusUpdateSchema,
  validateSchema 
} from '../../../shared/src/schemas';
import { 
  ComplaintSubmission, 
  ApiResponse, 
  ComplaintResponse,
  Complaint,
  PaginatedResponse,
  ClassificationResult,
  IssueCategory,
  StatusUpdate,
  StatusHistory
} from '../../../shared/src/types';
import { validateImageType, generateSafeFilename, getImageMetadata } from '../utils/imageUtils';
import '../types/session'; // Import session type extensions

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate safe filename using utility function
    const safeFilename = generateSafeFilename(file.originalname);
    cb(null, safeFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per request
  },
  fileFilter: (req, file, cb) => {
    // Validate file type using utility function - only check filename for now
    if (validateImageType(file.originalname)) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
      }
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

/**
 * POST /api/complaints - Submit a new complaint
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Parse and validate the complaint data
    const complaintData = JSON.parse(req.body.complaint || '{}');
    
    // Validate the complaint submission data
    const validatedData = validateSchema(ComplaintSubmissionSchema, complaintData);
    
    // Validate uploaded file if present
    if (req.file) {
      validateSchema(ImageFileSchema, {
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    // Sanitize input data
    const sanitizedSubmission: ComplaintSubmission = {
      buildingAddress: validatedData.buildingAddress.trim(),
      description: validatedData.description.trim(),
      category: validatedData.category,
      landlordInfo: validatedData.landlordInfo ? {
        name: validatedData.landlordInfo.name.trim(),
        contactInfo: validatedData.landlordInfo.contactInfo?.trim()
      } : undefined
    };

    // Add file information if uploaded
    if (req.file) {
      sanitizedSubmission.imageFile = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } as any; // Type assertion for multer file object
    }

    // Get database and create complaint
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    const complaint = await complaintRepo.create(sanitizedSubmission);

    // Create response with classification information
    const classificationResult = await complaintRepo.getClassificationResult(complaint.id);
    
    const response: ComplaintResponse = {
      id: complaint.id,
      buildingAddress: complaint.buildingAddress,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status,
      imageUrl: complaint.imageUrl,
      upvotes: complaint.upvotes,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      classification: classificationResult || undefined
    };

    const apiResponse: ApiResponse<ComplaintResponse> = {
      success: true,
      data: response,
      message: 'Complaint submitted successfully'
    };

    res.status(201).json(apiResponse);

  } catch (error) {
    console.error('Error submitting complaint:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }

    // Handle validation errors
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    // Handle multer errors
    if (error instanceof multer.MulterError) {
      let message = 'File upload error';
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large. Maximum size is 5MB';
      } else if (error.code === 'LIMIT_FILE_COUNT') {
        message = 'Too many files. Only one image allowed';
      }
      
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Upload Error',
        message
      };
      return res.status(400).json(apiResponse);
    }

    // Generic error response
    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to submit complaint'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/complaints - Get complaints with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    // Validate and parse query parameters
    const filters = validateSchema(ComplaintFiltersSchema, req.query);
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    const complaints = await complaintRepo.findMany(filters);
    const total = complaints.length; // For simplicity, not implementing separate count query
    
    const response: PaginatedResponse<Complaint> = {
      data: complaints,
      total,
      page: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
      limit: filters.limit || 20,
      hasNext: complaints.length === (filters.limit || 20),
      hasPrev: (filters.offset || 0) > 0
    };

    const apiResponse: ApiResponse<PaginatedResponse<Complaint>> = {
      success: true,
      data: response
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error fetching complaints:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch complaints'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/complaints/:id - Get a specific complaint by ID
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id } = validateSchema(ComplaintIdParamSchema, req.params);
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    const complaint = await complaintRepo.findById(id);
    
    if (!complaint) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    const apiResponse: ApiResponse<Complaint> = {
      success: true,
      data: complaint
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error fetching complaint:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch complaint'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * POST /api/complaints/:id/upvote - Add an upvote to a complaint
 */
router.post('/:id/upvote', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id } = validateSchema(ComplaintIdParamSchema, req.params);
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    const upvoteRepo = new UpvoteRepository(db);
    
    // Check if complaint exists
    const complaint = await complaintRepo.findById(id);
    if (!complaint) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    // Get or create session ID
    if (!req.session.id) {
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
        }
      });
    }

    const sessionId = req.session.id!;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check if user has already upvoted
    const hasUpvoted = await upvoteRepo.hasUpvoted(id, sessionId);
    if (hasUpvoted) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Already Upvoted',
        message: 'You have already upvoted this complaint'
      };
      return res.status(409).json(apiResponse);
    }

    // Add upvote
    const success = await upvoteRepo.addUpvote(id, sessionId, ipAddress);
    if (!success) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Upvote Failed',
        message: 'Failed to add upvote'
      };
      return res.status(500).json(apiResponse);
    }
    
    // Get updated complaint
    const updatedComplaint = await complaintRepo.findById(id);

    const apiResponse: ApiResponse<Complaint> = {
      success: true,
      data: updatedComplaint!,
      message: 'Upvote added successfully'
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error adding upvote:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to add upvote'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * DELETE /api/complaints/:id/upvote - Remove an upvote from a complaint
 */
router.delete('/:id/upvote', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id } = validateSchema(ComplaintIdParamSchema, req.params);
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    const upvoteRepo = new UpvoteRepository(db);
    
    // Check if complaint exists
    const complaint = await complaintRepo.findById(id);
    if (!complaint) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    // Get session ID
    const sessionId = req.session.id;
    if (!sessionId) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'No Session',
        message: 'No active session found'
      };
      return res.status(400).json(apiResponse);
    }

    // Remove upvote
    const success = await upvoteRepo.removeUpvote(id, sessionId);
    if (!success) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'No upvote found to remove'
      };
      return res.status(404).json(apiResponse);
    }
    
    // Get updated complaint
    const updatedComplaint = await complaintRepo.findById(id);

    const apiResponse: ApiResponse<Complaint> = {
      success: true,
      data: updatedComplaint!,
      message: 'Upvote removed successfully'
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error removing upvote:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to remove upvote'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/complaints/:id/upvote-status - Check if current session has upvoted
 */
router.get('/:id/upvote-status', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id } = validateSchema(ComplaintIdParamSchema, req.params);
    
    const db = getDatabase();
    const upvoteRepo = new UpvoteRepository(db);
    
    // Get session ID
    const sessionId = req.session.id;
    const hasUpvoted = sessionId ? await upvoteRepo.hasUpvoted(id, sessionId) : false;

    const apiResponse: ApiResponse<{ hasUpvoted: boolean }> = {
      success: true,
      data: { hasUpvoted }
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error checking upvote status:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to check upvote status'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * PUT /api/complaints/:id/category - Update complaint category (manual override)
 */
router.put('/:id/category', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id } = validateSchema(ComplaintIdParamSchema, req.params);
    
    // Validate category in request body
    const { category } = validateSchema(
      z.object({ category: IssueCategorySchema }), 
      req.body
    );
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    // Check if complaint exists
    const complaint = await complaintRepo.findById(id);
    if (!complaint) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    // Update category
    await complaintRepo.updateCategory(id, category);
    
    // Get updated complaint
    const updatedComplaint = await complaintRepo.findById(id);

    const apiResponse: ApiResponse<Complaint> = {
      success: true,
      data: updatedComplaint!,
      message: 'Category updated successfully'
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update category'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/complaints/:id/classification - Get AI classification result for a complaint
 */
router.get('/:id/classification', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id } = validateSchema(ComplaintIdParamSchema, req.params);
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    const classificationResult = await complaintRepo.getClassificationResult(id);
    
    if (!classificationResult) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Classification result not found'
      };
      return res.status(404).json(apiResponse);
    }

    const apiResponse: ApiResponse<ClassificationResult> = {
      success: true,
      data: classificationResult
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error fetching classification:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch classification'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/complaints/:id/image - Get image preview for a complaint
 */
router.get('/:id/image', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id } = validateSchema(ComplaintIdParamSchema, req.params);
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    const complaint = await complaintRepo.findById(id);
    
    if (!complaint) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    if (!complaint.imageUrl) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'No image found for this complaint'
      };
      return res.status(404).json(apiResponse);
    }

    // Extract filename from imageUrl (format: /uploads/filename)
    const filename = complaint.imageUrl.replace('/uploads/', '');
    const imagePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Image file not found on server'
      };
      return res.status(404).json(apiResponse);
    }

    // Serve the image file
    res.sendFile(imagePath);

  } catch (error) {
    console.error('Error serving image:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to serve image'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * PUT /api/complaints/:id/status - Update complaint status
 */
router.put('/:id/status', async (req, res) => {
  let id: string = '';
  
  try {
    // Validate complaint ID parameter
    const validatedParams = validateSchema(ComplaintIdParamSchema, req.params);
    id = validatedParams.id;
    
    // Validate status update data
    const statusUpdateData = validateSchema(StatusUpdateSchema, {
      complaintId: id,
      newStatus: req.body.newStatus,
      notes: req.body.notes
    });
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    // Check if complaint exists
    const complaint = await complaintRepo.findById(id);
    if (!complaint) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    // Update status
    await complaintRepo.updateStatus(statusUpdateData);
    
    // Get updated complaint
    const updatedComplaint = await complaintRepo.findById(id);

    const apiResponse: ApiResponse<Complaint> = {
      success: true,
      data: updatedComplaint!,
      message: 'Status updated successfully'
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error updating status:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update status'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/complaints/:id/status-history - Get status history for a complaint
 */
router.get('/:id/status-history', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id } = validateSchema(ComplaintIdParamSchema, req.params);
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    
    // Check if complaint exists
    const complaint = await complaintRepo.findById(id);
    if (!complaint) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    // Get status history
    const statusHistory = await complaintRepo.getStatusHistory(id);

    const apiResponse: ApiResponse<StatusHistory[]> = {
      success: true,
      data: statusHistory
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error fetching status history:', error);
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Validation Error',
        message: error.message
      };
      return res.status(400).json(apiResponse);
    }

    const apiResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch status history'
    };
    res.status(500).json(apiResponse);
  }
});

export default router;