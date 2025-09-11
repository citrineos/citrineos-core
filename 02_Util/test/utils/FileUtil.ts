// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import path from 'path';
import fs from 'fs';

export const readFile = (fileName: string): string => {
  const filePath = path.resolve(__dirname, `../resources/${fileName}`);
  return fs.readFileSync(filePath, 'utf8');
};
