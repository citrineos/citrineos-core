import Ajv, { type Options } from 'ajv';
import { injectable, unmanaged } from 'inversify';
import { OCPPValidator } from './OCPPValidator.js';

@injectable()
export class ValidatorAjv extends Ajv.Ajv {
  constructor(@unmanaged() options?: Options) {
    super({
      ...options,
      useDefaults: true,
      // No coerceTypes: OCPP messages are parsed JSON — types are already correct,
      // and coercion could silently corrupt data that should instead be rejected.
      strict: false,
      strictNumbers: true, // Reject numeric strings where a number is required
      validateFormats: true,
      allErrors: true,
    });

    OCPPValidator.addOcppKeywords(this);
    OCPPValidator.addFormats(this);
  }
}
