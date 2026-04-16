import mongoose from 'mongoose';

const codeSnapshotSchema = new mongoose.Schema({
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        unique: true
    },
    content: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        default: 'javascript'
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const CodeSnapshot = mongoose.model('CodeSnapshot', codeSnapshotSchema);

export default CodeSnapshot;
