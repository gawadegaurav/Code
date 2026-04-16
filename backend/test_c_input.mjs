import { spawn } from 'child_process';
import fs from 'fs';

const code = `
#include <stdio.h>
int main() {
    int num;
    printf("Enter a number: ");
    scanf("%d", &num);
    printf("You entered: %d\\n", num);
    return 0;
}
`;

fs.writeFileSync('temp_c.c', code);
const compile = spawn('gcc', ['temp_c.c', '-o', 'temp_c.exe'], { shell: true });

compile.on('close', (code) => {
    if (code !== 0) {
        console.error("Compilation failed");
        return;
    }

    console.log("Compiled successfully. Running...");
    const child = spawn('temp_c.exe', [], { shell: true });

    child.stdout.on('data', (data) => console.log(`stdout: ${data}`));
    child.stderr.on('data', (data) => console.error(`stderr: ${data}`));

    // Provide input
    child.stdin.write("42\n");
    child.stdin.end();

    child.on('close', (code) => console.log(`child process exited with code ${code}`));
});
