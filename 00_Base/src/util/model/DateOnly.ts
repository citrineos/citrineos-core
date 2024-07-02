import {assert, Brand} from "./global";

export type YearMonthDay = Brand<string, 'YearMonthDay'>;

const yearMonthDayPattern = /([12]\d{3})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/;

export function isYearMonthDay(value: string): value is YearMonthDay {
    return yearMonthDayPattern.test(value);
}

export function yearMonthDay(value: string): YearMonthDay {
    assert(isYearMonthDay(value), `Invalid date: ${value}`);
    return value;
}

function splitYearMonthDay(value: YearMonthDay): [number, number, number] {
    const [year, month, day] = value.split('-').map(Number);
    return [year, month, day];
}

export class DateOnly {

    private constructor(
        public readonly year: number,
        public readonly month: number,
        public readonly day: number
    ) {
    }

    public static of(value: string): DateOnly {
        if (isYearMonthDay(value)) {
            return new DateOnly(...splitYearMonthDay(value));
        } else {
            throw new Error(`Invalid date: ${value}`);
        }
    }

    get yearMonthDay(): YearMonthDay {
        return yearMonthDay(`${this.year}-${this.format(this.month)}-${this.format(this.day)}`);
    }

    private format(number: number): string {
        return number.toString().padStart(2, '0');
    }
}

