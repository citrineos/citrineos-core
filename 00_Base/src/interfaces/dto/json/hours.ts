export class Hours {
  regular_hours?: RegularHours[] | null;

  twentyfourseven!: boolean;

  exceptional_openings?: ExceptionalPeriod[] | null;

  exceptional_closings?: ExceptionalPeriod[] | null;
}

export class RegularHours {
  weekday!: number;

  period_begin!: string;

  period_end!: string;
}

export class ExceptionalPeriod {
  period_begin!: Date;

  period_end!: Date;
}
