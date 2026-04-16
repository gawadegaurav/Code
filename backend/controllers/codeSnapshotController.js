import CodeSnapshot from '../models/CodeSnapshot.js';

// Helper to save/update snapshot (used by socket and controller)
export const updateSnapshot = async (room_id, content, language, userId) => {
    return await CodeSnapshot.findOneAndUpdate(
        { room_id },
        {
            content,
            language,
            updated_by: userId
        },
        { returnDocument: 'after', upsert: true }
    );
};

// @desc    Save or update code snapshot
// @route   POST /api/snapshots
// @access  Private
export const saveSnapshot = async (req, res) => {
    const { room_id, content, language } = req.body;

    try {
        const snapshot = await updateSnapshot(room_id, content, language, req.user._id);
        res.status(200).json(snapshot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get code snapshot for a room
// @route   GET /api/snapshots/:roomId
// @access  Private
export const getSnapshot = async (req, res) => {
    try {
        const snapshot = await CodeSnapshot.findOne({ room_id: req.params.roomId });

        if (!snapshot) {
            return res.status(404).json({ message: 'Snapshot not found' });
        }

        res.json(snapshot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
