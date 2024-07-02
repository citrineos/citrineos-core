export function safelyMap<T, U>(value: T | undefined | null, mapper: (value: T) => U): U | undefined {
    return value !== undefined && value !== null ? mapper(value) : undefined;
}