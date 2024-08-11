import * as path from 'path';
import { promises as fs } from 'fs';

const source = process.argv[2];
const target = process.argv[3];

console.log(`Copying assets from ${source} to ${target}`);

if (!source || !target) {
  console.error(
    `Error: need valid source and target. Received source: ${source}, target: ${target}`,
  );
  process.exit(1);
}

async function copyDirectory(src: string, dest: string) {
  try {
    await fs.mkdir(dest, { recursive: true });
    console.log(`Created "${dest}" directory`);

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
        console.log(`Copied ${srcPath} to ${destPath}`);
      }
    }
  } catch (err) {
    console.error('Error copying directory:', err);
    process.exit(1);
  }
}

async function copy(s: string, t: string) {
  const srcDir = path.resolve(s);
  const destDir = path.resolve(t);
  await copyDirectory(srcDir, destDir);
  console.log(`Successfully copied assets from ${srcDir} to ${destDir}`);
}

copy(source, target)
  .then(() => {
    console.log(`Completed copying assets from ${source} to ${target}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
