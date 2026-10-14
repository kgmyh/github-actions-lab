import { readFile, writeFile } from 'node:fs/promises';

const mode = process.argv[2];
if (!['break', 'fix', 'update'].includes(mode)) {
  console.error('사용법: npm run lab:break, npm run lab:fix 또는 npm run lab:update');
  process.exit(1);
}
if (mode === 'update') {
  const html = new URL('../src/index.html', import.meta.url);
  const source = await readFile(html, 'utf8');
  if (!source.includes('<h1>팁 계산기</h1>') && !source.includes('<h1>한 끼 팁 계산기</h1>')) {
    console.error('기본 제목을 찾지 못했습니다. src/index.html을 확인하세요.');
    process.exit(1);
  }
  await writeFile(html, source.replace('<h1>팁 계산기</h1>', '<h1>한 끼 팁 계산기</h1>'));
  console.log('제목을 한 끼 팁 계산기로 변경했습니다. git diff로 확인하세요.');
  process.exit(0);
}
const file = new URL('../src/calculator.js', import.meta.url);
const source = await readFile(file, 'utf8');
const marker = /^const TIP_DIVISOR = (100|10);$/m;
if (!marker.test(source)) {
  console.error('실습용 상수를 찾지 못했습니다. src/calculator.js의 변경 내용을 확인하세요.');
  process.exit(1);
}
const divisor = mode === 'break' ? 10 : 100;
await writeFile(file, source.replace(marker, `const TIP_DIVISOR = ${divisor};`));
console.log(mode === 'break'
  ? '의도적인 버그를 넣었습니다. npm test가 실패하는지 확인하세요.'
  : '정상 계산으로 복구했습니다. npm test가 성공하는지 확인하세요.');
