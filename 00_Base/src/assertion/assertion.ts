export function assert(
  predicate: boolean | (() => boolean),
  message?: string,
): asserts predicate {
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

export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || obj1 === null ||
    typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}