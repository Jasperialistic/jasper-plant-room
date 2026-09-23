import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = resolve(root, 'index.html');
const source = await readFile(indexPath, 'utf8');
const marker = /window\.PLANT_IMAGES=(\{[^\r\n]+\});/;
const match = source.match(marker);

if (!match) throw new Error('Could not locate window.PLANT_IMAGES in index.html.');

const images = JSON.parse(match[1]);
let extracted = 0;
let extractedBytes = 0;
const external = {};

for (const [relativePath, value] of Object.entries(images)) {
  const data = String(value).match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!data) {
    external[relativePath] = value;
    continue;
  }

  const expectedExtension = `.${data[1].replace('jpeg', 'jpg')}`;
  const actualExtension = extname(relativePath).toLowerCase().replace('.jpeg', '.jpg');
  if (actualExtension !== expectedExtension) {
    throw new Error(`MIME/extension mismatch for ${relativePath}: image/${data[1]}`);
  }

  const outputPath = resolve(root, relativePath);
  if (!outputPath.startsWith(`${root}\\`) && !outputPath.startsWith(`${root}/`)) {
    throw new Error(`Refusing to write outside the repository: ${relativePath}`);
  }

  const bytes = Buffer.from(data[2], 'base64');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  external[relativePath] = relativePath.replaceAll('\\', '/');
  extracted += 1;
  extractedBytes += bytes.length;
}

const replacement = `window.PLANT_IMAGES=${JSON.stringify(external)};`;
const updated = source.replace(marker, replacement);
if (updated !== source) await writeFile(indexPath, updated, 'utf8');
console.log(JSON.stringify({ extracted, extractedBytes, external: Object.keys(external).length, indexBytes: Buffer.byteLength(updated) }));
