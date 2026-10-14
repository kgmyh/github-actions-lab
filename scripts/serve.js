import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const root = new URL('../dist/', import.meta.url);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = new URL(`.${path.endsWith('/') ? `${path}index.html` : path}`, root);
    if (!file.href.startsWith(root.href)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const content = await readFile(file);
    const extension = file.pathname.slice(file.pathname.lastIndexOf('.'));
    response.writeHead(200, { 'Content-Type': `${types[extension] ?? 'application/octet-stream'}; charset=utf-8` });
    response.end(content);
  } catch {
    response.writeHead(404).end('Not found. Run npm run build first.');
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('미리보기: http://127.0.0.1:4173 (종료: Ctrl+C)');
});
