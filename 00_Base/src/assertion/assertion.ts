export function assert<T>(
  predicate: boolean,
  message?: string,
): asserts predicate;
export function assert<T>(
  predicate: () => boolean,
  message?: string,
): asserts predicate;
export function assert<T>(
  predicate: boolean | (() => boolean),
  message?: string,
): asserts predicate {
  switch (typeof predicate) {
    case 'boolean':
      if (!predicate) {throw new Error(message); }
      break;
    case 'function':
      if (!predicate()) {throw new Error(message); }
      break;
    default:
      const exhaustiveCheck: never = predicate;
  }
}

export function notNull<T>(object: T): boolean {
  return object !== undefined && object !== null;
}
