import { spawn } from 'node-pty';

const pty = spawn('npx', ['drizzle-kit', 'generate'], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.cwd(),
  env: process.env
});

let buffer = '';

pty.onData((data) => {
  buffer += data;
  process.stdout.write(data);
  
  // Check for prompts and auto-answer
  if (buffer.includes('create column') && buffer.includes('rename column')) {
    setTimeout(() => {
      pty.write('\r');
      buffer = '';
    }, 200);
  }
});

pty.onExit(({ exitCode }) => {
  console.log(`\nProcess exited with code ${exitCode}`);
  process.exit(exitCode);
});

// Timeout after 2 minutes
setTimeout(() => {
  console.log('\nTimeout - killing process');
  pty.kill();
  process.exit(1);
}, 120000);
