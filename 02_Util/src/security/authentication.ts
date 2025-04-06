// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import { randomBytes } from 'node:crypto';

const MIN_LENGTH = 16;
const MAX_LENGTH = 40;

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '*-_=:+|@.';
const CHARSET = [...LOWERCASE, ...UPPERCASE, ...DIGITS, ...SYMBOLS];

export function generatePassword(): string {
  return [...randomBytes(MAX_LENGTH)].map((value) => CHARSET[value % CHARSET.length]).join('');
}

export function isValidPassword(password: string): boolean {
  if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    return false;
  }

  for (const char of password) {
    if (!CHARSET.includes(char)) {
      return false;
    }
  }
  return true;
}
