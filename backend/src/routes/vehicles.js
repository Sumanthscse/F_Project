import express from 'express';
import { body, query, param } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authMiddleware, operatorOrAdmin } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import { Op } from 'sequelize';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/vehicles - Get all vehicles with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['active', 'suspended', 'flagged', 'inactive']).withMessage('Invalid status'),
  query('vehicleType').optional().isIn(['truck', 'dumper', 'trailer', 'tipper', 'other']).withMessage('Invalid vehicle type'),
  validateRequest
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      vehicleType
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (vehicleType) whereClause.vehicleType = vehicleType;
    
    if (search) {
      whereClause[Op.or] = [
        { vehicleNumber: { [Op.iLike]: `%${search}%` } },
        { ownerName: { [Op.iLike]: `%${search}%` } },
        { ownerPhone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// POST /api/vehicles - Create new vehicle
router.post('/', [
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('vehicleType').isIn(['truck', 'dumper', 'trailer', 'tipper', 'other']).withMessage('Invalid vehicle type'),
  body('ownerName').notEmpty().withMessage('Owner name is required'),
  body('ownerPhone').notEmpty().withMessage('Owner phone is required'),
  body('ownerAddress').notEmpty().withMessage('Owner address is required'),
  body('registrationDate').isISO8601().withMessage('Invalid registration date'),
  validateRequest
], operatorOrAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({
      message: 'Vehicle registered successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to register vehicle' });
  }
});

// GET /api/vehicles/:id - Get vehicle by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  validateRequest
], async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({ vehicle });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  body('vehicleNumber').optional().notEmpty().withMessage('Vehicle number cannot be empty'),
  body('vehicleType').optional().isIn(['truck', 'dumper', 'trailer', 'tipper', 'other']).withMessage('Invalid vehicle type'),
  validateRequest
], operatorOrAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    await vehicle.update(req.body);
    
    res.json({
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  validateRequest
], operatorOrAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    await vehicle.destroy();
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// PUT /api/vehicles/:id/status - Update vehicle status
router.put('/:id/status', [
  param('id').isUUID().withMessage('Invalid vehicle ID'),
  body('status').isIn(['active', 'suspended', 'flagged', 'inactive']).withMessage('Invalid status'),
  validateRequest
], operatorOrAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    await vehicle.update({ status: req.body.status });
    
    res.json({
      message: 'Vehicle status updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({ error: 'Failed to update vehicle status' });
  }
});

export default router;


