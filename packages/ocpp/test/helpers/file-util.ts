// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import path from 'path';
import fs from 'fs';

export const readFile = (fileName: string): string => {
  const filePath = path.resolve(__dirname, `../resources/${fileName}`);
  return fs.readFileSync(filePath, 'utf8');
};
