/**
 * Evidence submission and management API routes
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { EvidenceRepository } from '../database/evidence';
import { ComplaintRepository } from '../database/complaints';
import { getDatabase } from '../database/connection';
import { 
  ComplaintIdParamSchema,
  ImageFileSchema,
  validateSchema 
} from '../../../shared/src/schemas';
import { 
  ApiResponse, 
  Evidence,
  PaginatedResponse
} from '../../../shared/src/types';
import { validateImageType, generateSafeFilename } from '../utils/imageUtils';

const router = express.Router();

// Configure multer for evidence image uploads
const uploadDir = path.join(__dirname, '../../uploads/evidence');

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
    // Validate file type using utility function
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

// Evidence submission schema
const EvidenceSubmissionSchema = z.object({
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
});

/**
 * POST /api/evidence/:complaintId - Submit evidence for a complaint
 */
router.post('/:complaintId', upload.single('image'), async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id: complaintId } = validateSchema(ComplaintIdParamSchema, { id: req.params.complaintId });
    
    // Parse and validate the evidence data
    const evidenceData = req.body.description ? { description: req.body.description } : JSON.parse(req.body.evidence || '{}');
    const validatedData = validateSchema(EvidenceSubmissionSchema, evidenceData);
    
    // Validate uploaded file if present
    if (req.file) {
      validateSchema(ImageFileSchema, {
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    const evidenceRepo = new EvidenceRepository(db);
    
    // Check if complaint exists
    const complaint = await complaintRepo.findById(complaintId);
    if (!complaint) {
      // Clean up uploaded file if complaint doesn't exist
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up uploaded file:', unlinkError);
        }
      }
      
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    // Prepare evidence submission
    const evidenceSubmission = {
      complaintId,
      description: validatedData.description.trim(),
      imageFile: req.file ? {
        name: req.file.filename,
        path: req.file.path
      } : undefined
    };

    // Create evidence
    const evidence = await evidenceRepo.create(evidenceSubmission);

    const apiResponse: ApiResponse<Evidence> = {
      success: true,
      data: evidence,
      message: 'Evidence submitted successfully'
    };

    res.status(201).json(apiResponse);

  } catch (error) {
    console.error('Error submitting evidence:', error);
    
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
      message: 'Failed to submit evidence'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/evidence/:complaintId - Get all evidence for a complaint
 */
router.get('/:complaintId', async (req, res) => {
  try {
    // Validate complaint ID parameter
    const { id: complaintId } = validateSchema(ComplaintIdParamSchema, { id: req.params.complaintId });
    
    const db = getDatabase();
    const complaintRepo = new ComplaintRepository(db);
    const evidenceRepo = new EvidenceRepository(db);
    
    // Check if complaint exists
    const complaint = await complaintRepo.findById(complaintId);
    if (!complaint) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Complaint not found'
      };
      return res.status(404).json(apiResponse);
    }

    // Get evidence for the complaint
    const evidence = await evidenceRepo.findByComplaintId(complaintId);

    const apiResponse: ApiResponse<Evidence[]> = {
      success: true,
      data: evidence
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error fetching evidence:', error);
    
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
      message: 'Failed to fetch evidence'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/evidence/item/:evidenceId - Get specific evidence by ID
 */
router.get('/item/:evidenceId', async (req, res) => {
  try {
    // Validate evidence ID parameter
    const { evidenceId } = validateSchema(z.object({ evidenceId: z.string().uuid() }), req.params);
    
    const db = getDatabase();
    const evidenceRepo = new EvidenceRepository(db);
    
    const evidence = await evidenceRepo.findById(evidenceId);
    
    if (!evidence) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Evidence not found'
      };
      return res.status(404).json(apiResponse);
    }

    const apiResponse: ApiResponse<Evidence> = {
      success: true,
      data: evidence
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error fetching evidence:', error);
    
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
      message: 'Failed to fetch evidence'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * GET /api/evidence/item/:evidenceId/image - Get evidence image
 */
router.get('/item/:evidenceId/image', async (req, res) => {
  try {
    // Validate evidence ID parameter
    const { evidenceId } = validateSchema(z.object({ evidenceId: z.string().uuid() }), req.params);
    
    const db = getDatabase();
    const evidenceRepo = new EvidenceRepository(db);
    
    const evidence = await evidenceRepo.findById(evidenceId);
    
    if (!evidence) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Evidence not found'
      };
      return res.status(404).json(apiResponse);
    }

    if (!evidence.imageUrl) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'No image found for this evidence'
      };
      return res.status(404).json(apiResponse);
    }

    // Extract filename from imageUrl (format: /uploads/evidence/filename)
    const filename = evidence.imageUrl.replace('/uploads/evidence/', '');
    const imagePath = path.join(__dirname, '../../uploads/evidence', filename);

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
    console.error('Error serving evidence image:', error);
    
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
      message: 'Failed to serve evidence image'
    };
    res.status(500).json(apiResponse);
  }
});

/**
 * DELETE /api/evidence/item/:evidenceId - Delete evidence (optional admin feature)
 */
router.delete('/item/:evidenceId', async (req, res) => {
  try {
    // Validate evidence ID parameter
    const { evidenceId } = validateSchema(z.object({ evidenceId: z.string().uuid() }), req.params);
    
    const db = getDatabase();
    const evidenceRepo = new EvidenceRepository(db);
    
    // Get evidence to check if it exists and get image path
    const evidence = await evidenceRepo.findById(evidenceId);
    if (!evidence) {
      const apiResponse: ApiResponse<never> = {
        success: false,
        error: 'Not Found',
        message: 'Evidence not found'
      };
      return res.status(404).json(apiResponse);
    }

    // Delete evidence from database
    await evidenceRepo.delete(evidenceId);

    // Clean up image file if it exists
    if (evidence.imageUrl) {
      const filename = evidence.imageUrl.replace('/uploads/evidence/', '');
      const imagePath = path.join(__dirname, '../../uploads/evidence', filename);
      
      try {
        await fs.unlink(imagePath);
      } catch (unlinkError) {
        console.error('Error cleaning up evidence image file:', unlinkError);
        // Don't fail the request if file cleanup fails
      }
    }

    const apiResponse: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      message: 'Evidence deleted successfully'
    };

    res.json(apiResponse);

  } catch (error) {
    console.error('Error deleting evidence:', error);
    
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
      message: 'Failed to delete evidence'
    };
    res.status(500).json(apiResponse);
  }
});

export default router;