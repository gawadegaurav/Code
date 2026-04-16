const { spawn } = require('child_process');

const code = `
name = input("Enter name: ")
print(f"Hello {name}!")
`;

const fs = require('fs');
fs.writeFileSync('temp_test.py', code);

const child = spawn('python', ['temp_test.py']);

let output = '';
let errOutput = '';

child.stdout.on('data', (data) => {
    output += data.toString();
});

child.stderr.on('data', (data) => {
    errOutput += data.toString();
});

child.on('close', (code) => {
    console.log("Output:", output);
    console.log("Error:", errOutput);
    console.log("Exit Code:", code);
});

// Provide standard input
child.stdin.write("John\n");
child.stdin.end();
