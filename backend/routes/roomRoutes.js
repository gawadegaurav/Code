import express from 'express';
import { createRoom, getRoomByCode, getUserRooms } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createRoom)
    .get(protect, getUserRooms);

router.route('/:code')
    .get(protect, getRoomByCode);

export default router;
