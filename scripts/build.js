import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const source = new URL('../src/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
await writeFile(new URL('.nojekyll', output), '');
console.log('빌드 완료: dist/에 배포할 HTML, CSS, JavaScript를 준비했습니다.');
