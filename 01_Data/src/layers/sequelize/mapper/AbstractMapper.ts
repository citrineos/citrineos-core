import { Model } from 'sequelize-typescript';
import { validateSync } from 'class-validator';

export abstract class AbstractMapper {
  abstract toModel(): Model;

  protected validate(): void {
    const errors = validateSync(this, { validationError: { target: false } });
    if (errors.length > 0) {
      throw new Error('Validation failed: ' + JSON.stringify(errors));
    }
  }
}
