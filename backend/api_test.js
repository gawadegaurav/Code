const axios = require('axios');

async function testNode() {
    const res = await axios.post('http://localhost:5000/api/run', {
        language: 'javascript',
        code: 'const name = "Node"; console.log("Hello", name);',
        input: ''
    });
    console.log("Node JS Test:", res.data);
}

async function testPython() {
    const res = await axios.post('http://localhost:5000/api/run', {
        language: 'python',
        code: 'name = input("Enter your name: ")\nprint(f"Hello {name}!")',
        input: 'Spark\n'
    });
    console.log("Python Test:", res.data);
}

async function run() {
    try {
        await testNode();
        await testPython();
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

run();
