import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Logger } from '@nestjs/common';

const logger = new Logger('OcppPayloadValidator');

/**
 * Transforms raw OCPP payload into a typed DTO and validates it.
 * Returns the validated instance, or throws FormatViolation if validation fails.
 *
 * Note: class-validator 0.14+ returns an { unknownValue } constraint for classes
 * with zero decorators (e.g. HeartbeatRequest). These are filtered out because
 * an empty class means "no constraints" — all payloads are valid for it.
 */
export async function validatePayload<T extends object>(
  DtoClass: new () => T,
  payload: Record<string, unknown>,
): Promise<T> {
  const instance = plainToInstance(DtoClass, payload, { exposeDefaultValues: true });
  const allErrors = await validate(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: true,
  });

  // Filter out the class-validator "no metadata" sentinel — classes with no
  // decorated properties are valid by definition (e.g. HeartbeatRequest).
  const errors = allErrors.filter(
    (e) => !(e.property === undefined && e.constraints && 'unknownValue' in e.constraints),
  );

  if (errors.length > 0) {
    const messages = errors
      .map((e) => {
        const constraints = Object.values(e.constraints ?? {}).join(', ');
        return e.property ? `${e.property}: ${constraints}` : constraints;
      })
      .join('; ');
    logger.warn(`OCPP payload validation failed [${DtoClass.name}]: ${messages}`);
    throw new Error(`FormatViolation [${DtoClass.name}]: ${messages}`);
  }

  return instance;
}
