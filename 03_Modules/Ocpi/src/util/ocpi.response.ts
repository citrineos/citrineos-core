import { IsDate, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Optional } from './decorators/optional';

export class OcpiResponse<T> {
  @IsNumber()
  status_code!: number;
  /**
   *
   * @type {string}
   * @memberof OcpiResponseDTO
   */
  @IsString()
  @Optional()
  status_message?: string;

  /**
   *
   * @type {string}
   * @memberof OcpiResponseDTO
   */
  @IsDate()
  timestamp!: Date;

  /**
   *
   * @type {object}
   * @memberof OcpiResponseDTO
   */
  @Optional()
  @ValidateNested()
  // @Type(() => T)  // Use class-transformer to indicate the type
  data?: T;
}

export const buildOcpiResponse = <T>(
  status_code: number,
  data?: T,
  status_message?: string,
) => {
  const response = new OcpiResponse<T>();
  response.status_code = status_code;
  response.status_message = status_message;
  response.data = data;
  response.timestamp = new Date();
  return response;
};
