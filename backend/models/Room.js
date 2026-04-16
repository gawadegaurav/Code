import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enable_whiteboard: {
        type: Boolean,
        default: false
    },
    enable_ai: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
