import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const srcDir = path.join(projectRoot, 'src');

const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const sourceExtensions = new Set(['.astro', '.md', '.mdx', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.scss', '.json', '.yaml', '.yml']);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }

      files.push(...(await walk(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function normalizePublicAssetPath(value) {
  if (!value) return null;

  const withoutQuery = value.split(/[?#]/, 1)[0];
  const trimmed = withoutQuery.trim();

  if (!trimmed || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('mailto:')) {
    return null;
  }

  const cleaned = trimmed.replace(/^\.\//, '').replace(/^(\.\.\/)+/, '').replace(/^(\.\/)+/, '');
  const candidate = cleaned.startsWith('/') ? path.join(publicDir, cleaned.slice(1)) : path.join(publicDir, cleaned);

  return candidate;
}

function toWebpPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!supportedExtensions.has(ext) || ext === '.webp') {
    return null;
  }

  return path.join(path.dirname(filePath), `${path.basename(filePath, ext)}.webp`);
}

async function convertPublicImages() {
  const files = await walk(publicDir);
  let convertedCount = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!supportedExtensions.has(ext) || ext === '.webp') {
      continue;
    }

    const outputPath = toWebpPath(filePath);
    if (!outputPath) {
      continue;
    }

    if (await exists(outputPath)) {
      const [sourceStats, outputStats] = await Promise.all([fs.stat(filePath), fs.stat(outputPath)]);
      if (outputStats.mtimeMs >= sourceStats.mtimeMs) {
        continue;
      }
    }

    await sharp(filePath).webp({ quality: 80 }).toFile(outputPath);
    convertedCount += 1;
  }

  return convertedCount;
}

async function updateSourceReferences() {
  const files = await walk(srcDir);
  const textFiles = files.filter((filePath) => sourceExtensions.has(path.extname(filePath).toLowerCase()));
  let updatedFiles = 0;

  for (const filePath of textFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    const referencePattern = /(["'`])([^"'`\n]+?\.(png|jpg|jpeg|gif))\1|\(([^)]+?\.(png|jpg|jpeg|gif))\)/g;
    let updatedContent = '';
    let lastIndex = 0;

    for (const match of content.matchAll(referencePattern)) {
      const value = match[2] || match[4];
      const fullMatch = match[0];
      const resolvedPath = normalizePublicAssetPath(value);

      updatedContent += content.slice(lastIndex, match.index);

      if (!resolvedPath) {
        updatedContent += fullMatch;
      } else {
        const webpPath = toWebpPath(resolvedPath);
        if (!webpPath || !(await exists(webpPath))) {
          updatedContent += fullMatch;
        } else {
          const publicRelativePath = path.relative(publicDir, webpPath).split(path.sep).join('/');
          const webpReference = `/${publicRelativePath}`;
          updatedContent += fullMatch.replace(value, webpReference);
        }
      }

      lastIndex = match.index + fullMatch.length;
    }

    updatedContent += content.slice(lastIndex);

    if (updatedContent !== content) {
      await fs.writeFile(filePath, updatedContent, 'utf8');
      updatedFiles += 1;
    }
  }

  return updatedFiles;
}

async function main() {
  console.log('Converting public images to .webp...');
  const convertedCount = await convertPublicImages();
  console.log(`Converted ${convertedCount} image(s) to .webp.`);

  console.log('Updating source image references...');
  const updatedFiles = await updateSourceReferences();
  console.log(`Updated ${updatedFiles} source file(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
