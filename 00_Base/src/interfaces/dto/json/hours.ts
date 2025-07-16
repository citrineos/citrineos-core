export class LocationHours {
  regularHours?: LocationRegularHours[] | null;
  twentyfourSeven!: boolean;
  exceptionalOpenings?: LocationExceptionalPeriod[] | null;
  exceptionalClosings?: LocationExceptionalPeriod[] | null;
}

export class LocationRegularHours {
  weekday!: number;
  periodBegin!: string;
  periodEnd!: string;
}

export class LocationExceptionalPeriod {
  periodBegin!: Date;
  periodEnd!: Date;
}
