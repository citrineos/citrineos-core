import {assert, Brand} from "./global";

export type HourMinute = Brand<string, 'HourMinute'>;

const hourMinutePattern = /^([0-1]\d|2[0-3]):[0-5]\d$/;

export function isHourMinute(value: string): value is HourMinute {
    return hourMinutePattern.test(value);
}

export function hourMinute(value: string): HourMinute {
    assert(isHourMinute(value), `Invalid time: ${value}`);
    return value;
}

export type HourMinuteSecond = Brand<string, 'HourMinuteSecond'>;
const hourMinuteSecondPattern = /^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

export function isHourMinuteSecond(value: string): value is HourMinuteSecond {
    return hourMinuteSecondPattern.test(value);
}

export function hourMinuteSecond(value: string): HourMinuteSecond {
    assert(isHourMinuteSecond(value), `Invalid time: ${value}`);
    return value;
}

function splitHourMinute(value: HourMinute): [number, number] {
    const [hour, minute] = value.split(':').map(Number);
    return [hour, minute];
}

function splitHourMinuteSecond(value: HourMinuteSecond): [number, number, number] {
    const [hour, minute, second] = value.split(':').map(Number);
    return [hour, minute, second];
}

export class Time {

    private constructor(
        public readonly hour: number,
        public readonly minute: number,
        public readonly second: number,
    ) {
    }

    public static of(value: string): Time {
        if (isHourMinuteSecond(value)) {
            return new Time(...splitHourMinuteSecond(value));
        } else if (isHourMinute(value)) {
            return new Time(...splitHourMinute(value), 0);
        } else {
            throw new Error(`Invalid time: ${value}`);
        }
    }

    get hourMinuteSecond(): HourMinuteSecond {
        return hourMinuteSecond(`${this.format(this.hour)}:${this.format(this.minute)}:${this.format(this.second)}`);
    }

    get hourMinute(): HourMinute {
        return hourMinute(`${this.format(this.hour)}:${this.format(this.minute)}`);
    }

    private format(number: number): string {
        return number.toString().padStart(2, '0');
    }
}
