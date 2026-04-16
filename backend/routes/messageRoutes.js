import express from 'express';
import { sendMessage, getRoomMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, sendMessage);

router.route('/:roomId')
    .get(protect, getRoomMessages);

export default router;
