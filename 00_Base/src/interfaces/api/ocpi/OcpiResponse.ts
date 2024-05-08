import {IsDate, IsNumber, IsOptional, IsString, ValidateNested} from 'class-validator';
import {Type} from "class-transformer";

export abstract class OcpiResponse<T> {
  @IsNumber()
  status_code!: number;
  /**
   *
   * @type {string}
   * @memberof OcpiResponseDTO
   */
  @IsString()
  @IsOptional()
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
  @IsOptional()
  @ValidateNested()
  // @Type(() => T)  // Use class-transformer to indicate the type
  abstract data?: T;

  static build<T>(
    status_code: number,
    data?: T,
    status_message?: string,
  ): OcpiResponse<T> {
    const response = new OcpiResponse<T>();
    response.status_code = status_code;
    response.status_message = status_message;
    response.data = data;
    response.timestamp = new Date();
    return response;
  }
}
