import Room from '../models/Room.js';

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
export const createRoom = async (req, res) => {
    const { name, code, enable_whiteboard, enable_ai } = req.body;

    try {
        const roomExists = await Room.findOne({ code });

        if (roomExists) {
            return res.status(400).json({ message: 'Room with this code already exists' });
        }

        const room = await Room.create({
            name,
            code,
            created_by: req.user._id,
            enable_whiteboard: enable_whiteboard || false,
            enable_ai: enable_ai || false
        });

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get room by code
// @route   GET /api/rooms/:code
// @access  Private
export const getRoomByCode = async (req, res) => {
    try {
        const room = await Room.findOne({ code: req.params.code }).populate('created_by', 'name avatar_url');

        if (room) {
            res.json(room);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user rooms
// @route   GET /api/rooms
// @access  Private
export const getUserRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ created_by: req.user._id }).sort({ createdAt: -1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private
export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if user is the creator
        if (room.created_by.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this room' });
        }

        await room.deleteOne();
        res.json({ message: 'Room removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
