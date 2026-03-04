import Ajv, { type Options } from 'ajv';
import { OCPPValidator } from './OCPPValidator.js';
import { injectable, unmanaged } from 'inversify';

@injectable()
export class ServerAjv extends Ajv.Ajv {
  constructor(@unmanaged() options?: Options) {
    super({
      ...options,
      removeAdditional: 'failing',
      useDefaults: true,
      coerceTypes: true, // HTTP query/path params arrive as strings and need coercion
      strict: false,
      allErrors: true,
    });
    OCPPValidator.addFormats(this);
  }
}
