/**
 * API routes for building and landlord profiles
 */

import express from 'express';
import { ProfileRepository } from '../database/profiles';
import { getDatabase } from '../database/connection';
import { ApiResponse } from '../../../shared/src/types';

const router = express.Router();

/**
 * GET /api/profiles/buildings/:address
 * Get building profile by address
 */
router.get('/buildings/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Building address is required'
      } as ApiResponse<null>);
    }

    const db = getDatabase();
    const profileRepo = new ProfileRepository(db);
    
    const profile = await profileRepo.getBuildingProfile(decodeURIComponent(address));
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Building profile not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: profile
    } as ApiResponse<typeof profile>);
    
  } catch (error) {
    console.error('Error getting building profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/profiles/landlords/:name
 * Get landlord profile by name
 */
router.get('/landlords/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Landlord name is required'
      } as ApiResponse<null>);
    }

    const db = getDatabase();
    const profileRepo = new ProfileRepository(db);
    
    const profile = await profileRepo.getLandlordProfile(decodeURIComponent(name));
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Landlord profile not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: profile
    } as ApiResponse<typeof profile>);
    
  } catch (error) {
    console.error('Error getting landlord profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/profiles/buildings
 * Get list of all building addresses with complaints
 */
router.get('/buildings', async (req, res) => {
  try {
    const db = getDatabase();
    const profileRepo = new ProfileRepository(db);
    
    const addresses = await profileRepo.getAllBuildingAddresses();

    res.json({
      success: true,
      data: addresses
    } as ApiResponse<string[]>);
    
  } catch (error) {
    console.error('Error getting building addresses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/profiles/landlords
 * Get list of all landlord names
 */
router.get('/landlords', async (req, res) => {
  try {
    const db = getDatabase();
    const profileRepo = new ProfileRepository(db);
    
    const names = await profileRepo.getAllLandlordNames();

    res.json({
      success: true,
      data: names
    } as ApiResponse<string[]>);
    
  } catch (error) {
    console.error('Error getting landlord names:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

export default router;