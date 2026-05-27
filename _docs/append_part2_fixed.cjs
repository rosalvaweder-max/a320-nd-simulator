const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '毕业论文-基于网页的飞机导航显示器模拟器开发.md');

// Read the content to append from a separate text file approach
// Instead, let's just use fs.appendFileSync with a simpler approach
// Write the content as a separate file first, then append

const content = fs.readFileSync(path.join(__dirname, 'thesis_part2_content.txt'), 'utf8');
fs.appendFileSync(filePath, content, 'utf8');
console.log('Part 2 appended successfully');
console.log('File size:', fs.statSync(filePath).size);
