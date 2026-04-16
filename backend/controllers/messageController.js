import Message from '../models/Message.js';

// Helper to save message (used by socket and controller)
export const saveMessage = async (room_id, user_id, content) => {
    const message = await Message.create({
        room_id,
        user_id,
        content
    });

    return await Message.findById(message._id).populate('user_id', 'name avatar_url');
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
    const { room_id, content } = req.body;

    try {
        const populateMessage = await saveMessage(room_id, req.user._id, content);
        res.status(201).json(populateMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get messages for a room
// @route   GET /api/messages/:roomId
// @access  Private
export const getRoomMessages = async (req, res) => {
    try {
        const messages = await Message.find({ room_id: req.params.roomId })
            .populate('user_id', 'name avatar_url')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
