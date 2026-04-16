import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let roomId = '';

async function test() {
    try {
        console.log('--- Testing Registration ---');
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: `Test User`,
            email: `test_${Date.now()}@example.com`,
            password: 'password123'
        });
        console.log('Registration Success');
        token = regRes.data.token;
        userId = regRes.data._id;

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('\n--- Testing Room Creation ---');
        const roomRes = await axios.post(`${BASE_URL}/rooms`, {
            name: 'Test Room',
            code: `code_${Date.now()}`,
            enable_whiteboard: true,
            enable_ai: true
        }, config);
        console.log('Room Created:', roomRes.data.name);
        roomId = roomRes.data._id;
        const roomCode = roomRes.data.code;

        console.log('\n--- Testing Get Room by Code ---');
        const getRoomRes = await axios.get(`${BASE_URL}/rooms/${roomCode}`, config);
        console.log('Room Retrieved:', getRoomRes.data.name);

        console.log('\n--- Testing Get User Rooms ---');
        const userRoomsRes = await axios.get(`${BASE_URL}/rooms`, config);
        console.log('User Rooms Count:', userRoomsRes.data.length);

        console.log('\n--- Testing Get Messages (Empty) ---');
        const msgRes = await axios.get(`${BASE_URL}/messages/${roomId}`, config);
        console.log('Messages retrieved:', msgRes.data.length);

        console.log('\n--- Testing Get Snapshot (Empty) ---');
        const snapRes = await axios.get(`${BASE_URL}/snapshots/${roomId}`, config);
        console.log('Snapshot content:', snapRes.data.content === '' ? '(empty)' : snapRes.data.content);

        console.log('\nBackend Verification Successful!');
    } catch (error) {
        console.error('Verification Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

test();
