import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

const mkdir = util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const copyFile = util.promisify(fs.copyFile);

async function copyDirectory(src: string, dest: string) {
  try {
    await mkdir(dest, { recursive: true });
    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  } catch (err) {
    console.error('Error copying directory:', err);
  }
}

async function main() {
  const srcDir = path.resolve(__dirname, './src/assets');
  const destDir = path.resolve(__dirname, './dist/assets');
  await copyDirectory(srcDir, destDir);
  console.log(`Successfully copied assets from ${srcDir} to ${destDir}`);
}

main();
