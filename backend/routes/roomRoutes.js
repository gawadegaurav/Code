import express from 'express';
import { createRoom, getRoomByCode, getUserRooms, deleteRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createRoom)
    .get(protect, getUserRooms);

router.route('/:code')
    .get(protect, getRoomByCode);

router.route('/id/:id')
    .delete(protect, deleteRoom);

export default router;
