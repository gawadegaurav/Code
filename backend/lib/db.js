import mongoose from 'mongoose';

const connectDB = async () => {
    const options = {
        serverSelectionTimeoutMS: 15000, // Timeout after 15s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        heartbeatFrequencyMS: 10000,
    };

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`📡 MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB Connection Error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB Disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB Reconnected.');
        });

    } catch (error) {
        console.error(`🔴 Critical DB Error: ${error.message}`);
        // Instead of exiting, we let Mongoose handle the retry logic if configured
        // But for initial connection, we might still want to exit if it's a config issue
        if (error.message.includes('ENOTFOUND')) {
            console.error('Check your internet connection or MongoDB URI in .env');
        }
    }
};

export default connectDB;
