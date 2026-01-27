import { spawn } from 'child_process';

const child = spawn('npx', ['drizzle-kit', 'generate'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

child.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
  
  // Auto-answer prompts by selecting first option (create column)
  if (text.includes('create column') || text.includes('rename column')) {
    setTimeout(() => {
      child.stdin.write('\n');
    }, 100);
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`\nProcess exited with code ${code}`);
  process.exit(code);
});

// Handle timeout
setTimeout(() => {
  console.log('\nTimeout reached, killing process');
  child.kill();
  process.exit(1);
}, 120000);
