const { spawn } = require('child_process');

const child = spawn('npx', ['vercel', 'link'], { stdio: ['pipe', 'pipe', 'pipe'] });

child.stdout.on('data', data => {
  const output = data.toString();
  console.log('STDOUT:', output);
  
  if (output.includes('Set up')) {
    setTimeout(() => child.stdin.write('y\n'), 500);
  }
  if (output.includes('Which scope')) {
    setTimeout(() => child.stdin.write('\n'), 500);
  }
  if (output.includes('Link to existing project')) {
    setTimeout(() => child.stdin.write('n\n'), 500);
  }
  if (output.includes('project’s name')) {
    setTimeout(() => child.stdin.write('car-market\n'), 500);
  }
  if (output.includes('In which directory')) {
    setTimeout(() => child.stdin.write('\n'), 500);
  }
});

child.stderr.on('data', data => {
  console.error('STDERR:', data.toString());
});

child.on('close', code => {
  console.log(`Process exited with code ${code}`);
});
