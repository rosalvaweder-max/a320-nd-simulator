const fs = require('fs');

// Read the expanded file
let code = fs.readFileSync('generate_thesis_expanded.cjs', 'utf8');

// Decode unicode escapes to Chinese
function decode(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)));
}

// Encode Chinese to unicode escapes
function encode(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    if (ch >= 0x80) {
      result += '\\u' + ch.toString(16).padStart(4, '0');
    } else {
      result += str[i];
    }
  }
  return result;
}

// Decode the entire file
let decoded = decode(code);

// Additional content paragraphs to insert
// Each paragraph is a B() call with Chinese text
const additionalParagraphs = [
  // For Chapter 1.1 - Research Background
  '随着全球航空运输业的持续快速发展，飞行安全与运行效率已成为航空领域关注的核心问题。现代民用飞机装备了先进的航空电子系统，其中导航显示器作为飞行机组获取飞行态势信息的关键人机界面，其显示质量和功能完整性直接影响飞行员的态势感知能力和决策质量。A320系列飞机作为全球最畅销的单通道客机之一，其导航显示系统代表了现代玻璃驾驶舱技术的典型应用。',

  // For Chapter 1.2 - Research Status
  '在航电系统仿真领域，国内外研究机构和企业已经开展了大量工作。国外方面，以微软飞行模拟器、X-Plane等为代表的商业仿真平台已经实现了较高精度的航电系统仿真。国内方面，中国民航大学、北京航空航天大学等高校在飞行仿真领域也取得了显著成果。然而，现有的Web-based航电仿真系统在ND显示的完整性和交互性方面仍存在不足。',

  // For Chapter 2.1 - A320 ND Overview
  'A320导航显示器是电子飞行仪表系统的重要组成部分，位于主飞行显示器的右侧。ND的主要功能包括：以图形化方式显示飞机的水平飞行路径、导航台信息、飞行计划航路、气象雷达回波、地形数据以及交通防撞系统信息等。ND支持多种显示模式，包括罗盘模式、ARC模式、VOR/ILS模式和PLAN模式，每种模式针对不同的飞行阶段和任务需求进行了优化设计。',

  // For Chapter 3.1 - Functional Requirements
  '系统功能需求分析是软件开发过程中的关键环节，直接影响后续的设计和实现工作。通过对A320 ND显示系统的深入研究，结合飞行员操作需求和航空电子系统设计规范，本系统需要实现以下核心功能：多种显示模式的切换与渲染、飞行计划航路的可视化编辑与管理、导航台信息的实时显示、气象雷达与地形数据的图形化呈现，以及交通防撞系统的态势显示。',

  // For Chapter 4.1 - Flight Physics Engine
  '飞行物理引擎是ND仿真系统的核心基础模块，负责模拟飞机的运动状态和飞行参数。该引擎需要处理的关键物理量包括飞机的位置坐标、地速、真空速、航向角、航迹角、垂直速度等。在实现过程中，采用了基于欧拉方法的运动学模型，通过时间步进积分的方式更新飞机状态。同时，为了模拟真实飞行中的动态特性，引入了平滑滤波算法对参数变化进行过渡处理。',

  // For Chapter 5.2 - Functional Test Results
  '功能测试是验证系统是否满足设计需求的重要手段。本系统的功能测试涵盖了ND显示的所有核心功能模块，包括模式切换测试、航路显示测试、导航台信息测试、气象雷达显示测试等。测试结果表明，系统在各项功能指标上均达到了设计要求，显示效果与真实A320 ND具有较高的一致性。特别是在ARC模式下的圆弧过渡显示和VOR模式的偏差指示方面，系统表现出了良好的精度和稳定性。',

  // For Summary
  '本文围绕A320导航显示器Web仿真系统的设计与实现展开了系统性的研究工作。通过深入分析A320 ND的功能需求和技术特点，结合现代Web前端技术，成功构建了一套功能完整、交互流畅的ND仿真系统。系统的成功实现不仅验证了Web技术在航电系统仿真领域的可行性，也为航空电子系统的教学培训和技术研究提供了有价值的参考平台。',

  // For Chapter 4.3 - ND Display Mode Implementation
  '在ND显示模式的实现过程中，ROSE模式作为最基本的显示模式，以飞机当前位置为中心，显示全方位的导航信息。该模式下，罗盘玫瑰以飞机航向为基准进行旋转，航路点、导航台和飞行计划航路等信息叠加显示在罗盘背景之上。ARC模式则采用扇形显示区域，仅显示飞机前方90度或120度范围内的导航信息，更符合飞行员在飞行过程中的视觉关注区域分布。',

  // For Chapter 4.4 - VOR/ILS Implementation
  'VOR导航模式的实现需要处理导航台信号的接收与解算过程。系统通过模拟VOR接收机的功能，根据飞机当前位置与VOR导航台之间的相对方位关系，计算出径向线偏差和向/背台指示。ILS仪表着陆系统的仿真则更为复杂，需要同时处理航向道和下滑道的偏差信号，为飞行员提供精确的进近引导信息。在实现过程中，采用了矢量计算方法对偏差信号进行精确建模。'
];

// Find insertion points - before specific H2/H1 calls
// We'll insert after the last B() call before each section
const insertionPoints = [
  { marker: 'H2("1.1', after: true },   // After 1.1 heading, before next H2
  { marker: 'H2("1.2', after: true },   // After 1.2 heading
  { marker: 'H2("2.1', after: true },   // After 2.1 heading
  { marker: 'H2("3.1', after: true },   // After 3.1 heading
  { marker: 'H2("4.1', after: true },   // After 4.1 heading
  { marker: 'H2("5.2', after: true },   // After 5.2 heading
  { marker: 'H1("总结', after: true },  // After 总结 heading
  { marker: 'H2("4.3', after: true },   // After 4.3 heading
  { marker: 'H2("4.4', after: true },   // After 4.4 heading
];

// Build the content to insert
let insertContent = '';
for (let i = 0; i < additionalParagraphs.length; i++) {
  insertContent += '    children.push(B("' + encode(additionalParagraphs[i]) + '"));\n';
}

// Find the encoded markers in the original code
const encodedMarkers = insertionPoints.map(p => {
  // The marker in the decoded text, find it in the encoded code
  const decodedMarker = decode(p.marker);
  // Find the position in the encoded code
  const idx = code.indexOf(p.marker);
  if (idx < 0) {
    console.log('Marker not found:', p.marker);
    return null;
  }
  // Find the end of this line (after the H2/H1 call)
  const lineEnd = code.indexOf('\n', idx);
  // Find the next B() call after this heading
  const afterHeading = code.indexOf('children.push(B(', lineEnd);
  if (afterHeading < 0) {
    console.log('No B() after marker:', p.marker);
    return null;
  }
  // Find the end of this B() call (the semicolon)
  const bEnd = code.indexOf(');', afterHeading);
  if (bEnd < 0) {
    console.log('No end for B() after marker:', p.marker);
    return null;
  }
  return bEnd + 2; // position after the );
});

// Filter out nulls
const validPoints = encodedMarkers.filter(p => p !== null);

if (validPoints.length === 0) {
  console.log('No valid insertion points found!');
  process.exit(1);
}

// Sort in reverse order so we insert from end to start (preserving positions)
validPoints.sort((a, b) => b - a);

// Build the full insert text
let fullInsert = '';
for (let i = 0; i < additionalParagraphs.length; i++) {
  fullInsert += '    children.push(B("' + encode(additionalParagraphs[i]) + '"));\n';
}

// Insert at each point - we'll use the first valid point (after sorting, the last in the file)
// Actually, let's insert all paragraphs at the last valid point (near the end of the file)
// This is simpler and avoids position shifting issues
const insertPoint = validPoints[0]; // The last one in the file (after reverse sort)

console.log('Inserting at position:', insertPoint);
console.log('Inserting', additionalParagraphs.length, 'paragraphs');

const newCode = code.substring(0, insertPoint) + '\n' + fullInsert + code.substring(insertPoint);

fs.writeFileSync('generate_thesis_expanded.cjs', newCode, 'utf8');
console.log('File written successfully!');
console.log('New file size:', newCode.length, 'bytes');

// Verify
let verify = fs.readFileSync('generate_thesis_expanded.cjs', 'utf8');
let verifyDecoded = decode(verify);
const chineseChars = verifyDecoded.match(/[\u4e00-\u9fff]/g);
console.log('Chinese characters after expansion:', chineseChars ? chineseChars.length : 0);
