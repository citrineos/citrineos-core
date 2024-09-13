import path from 'path';
import fs from 'fs';

export const readFile = (fileName: string): string => {
  const filePath = path.resolve(__dirname, `../resources/${fileName}`);
  return fs.readFileSync(filePath, 'utf8');
};
