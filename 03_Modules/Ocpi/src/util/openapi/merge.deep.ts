import _merge from 'lodash.merge';

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export const mergeDeep = (target: any, ...sources: any[]): any => _merge(target, ...sources);
