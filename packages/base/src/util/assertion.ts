// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
export function assert(predicate: boolean | (() => boolean), message?: string): asserts predicate {
  switch (typeof predicate) {
    case 'boolean': {
      if (!predicate) {
        throw new Error(message);
      }
      break;
    }
    case 'function': {
      if (!predicate()) {
        throw new Error(message);
      }
      break;
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = predicate;
    }
  }
}

export function notNull(object: any): boolean {
  return object !== undefined && object !== null;
}
