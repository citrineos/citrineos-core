/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param sources
 */
export const merge = <T>(target: T, ...sources: T[]): T => {
  if (!sources.length) return target as T;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!(target as any).key)
          Object.assign(target as object, { [key]: {} });
        merge((target as any)[key], source[key]);
      } else {
        Object.assign(target as object, { [key]: source[key] });
      }
    }
  }

  return merge(target, ...sources);
};
