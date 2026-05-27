const fs = require('fs');
const c = fs.readFileSync('App.js', 'utf8');
const lines = c.split('\n');
let p = 0, b = 0, k = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '(') p++;
    if (ch === ')') p--;
    if (ch === '[') b++;
    if (ch === ']') b--;
    if (ch === '{') k++;
    if (ch === '}') k--;
  }
  if (p !== 0 || b !== 0 || k !== 0) {
    console.log(`Line ${i+1}: P=${p} B=${b} K=${k} | ${line.trim().substring(0, 80)}`);
  }
}
console.log(`\nFinal: P=${p} B=${b} K=${k}`);
