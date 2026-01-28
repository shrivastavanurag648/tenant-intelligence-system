/**
 * Image utility functions for the Tenant Intelligence System
 */

import path from 'path';
import fs from 'fs/promises';

/**
 * Validate image file type based on file extension and magic bytes
 */
export function validateImageType(filename: string, buffer?: Buffer): boolean {
  const ext = path.extname(filename).toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  if (!validExtensions.includes(ext)) {
    return false;
  }

  // Basic magic byte validation if buffer is provided
  if (buffer && buffer.length > 0) {
    const magicBytes = buffer.subarray(0, 4);
    
    // JPEG magic bytes: FF D8 FF
    if (ext === '.jpg' || ext === '.jpeg') {
      return magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF;
    }
    
    // PNG magic bytes: 89 50 4E 47
    if (ext === '.png') {
      return magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && 
             magicBytes[2] === 0x4E && magicBytes[3] === 0x47;
    }
    
    // WebP magic bytes: 52 49 46 46 (RIFF)
    if (ext === '.webp') {
      return magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && 
             magicBytes[2] === 0x46 && magicBytes[3] === 0x46;
    }
  }

  return true; // If no buffer provided, just validate extension
}

/**
 * Get image metadata (size, dimensions if available)
 */
export async function getImageMetadata(filePath: string): Promise<{
  size: number;
  exists: boolean;
  mimeType?: string;
}> {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let mimeType: string | undefined;
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
    }

    return {
      size: stats.size,
      exists: true,
      mimeType
    };
  } catch (error) {
    return {
      size: 0,
      exists: false
    };
  }
}

/**
 * Clean up old uploaded files (for maintenance)
 */
export async function cleanupOldFiles(uploadDir: string, maxAgeHours: number = 24): Promise<number> {
  try {
    const files = await fs.readdir(uploadDir);
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    return 0;
  }
}

/**
 * Generate a safe filename for uploaded images
 */
export function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  
  return `complaint-${timestamp}-${random}${ext}`;
}