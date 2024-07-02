declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B }

export function assert<T>(predicate: boolean, message?: string): asserts predicate;
export function assert<T>(predicate: () => boolean, message?: string): asserts predicate;
export function assert<T>(predicate: boolean | (() => boolean), message?: string): asserts predicate {
    switch (typeof predicate) {
        case 'boolean':
            if (!predicate) throw new Error(message);
            break;
        case 'function':
            if (!predicate()) throw new Error(message);
            break;
        default:
            const exhaustiveCheck: never = predicate;
    }
}

export function assertion<T>(predicate: (value: T) => boolean, message?: string): (value: T) => void {
    return (value: T) => assert(predicate(value), message);
}

export function notEmpty<T>(array: T[]): boolean {
    return array.length > 0;
}

export function hasDuplicates<T>(items: T[], key: keyof T): boolean {
    return items.length !== new Set(items.map(item => item[key])).size;
}
