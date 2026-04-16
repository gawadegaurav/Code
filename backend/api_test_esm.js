import axios from 'axios';

async function testC() {
    try {
        console.log("Testing C compilation...");
        const res = await axios.post('http://localhost:5000/api/run', {
            language: 'c',
            code: '#include <stdio.h>\nint main() {\n    printf("Hello form C local!\\n");\n    return 0;\n}',
            input: ''
        });
        console.log("[C] Output:", res.data);
    } catch (err) {
        console.error("Test failed:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
    }
}

testC();
