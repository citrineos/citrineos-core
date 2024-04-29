import { IsDate, IsNumber, IsString } from 'class-validator';

export class OcpiResponse<T> {
  @IsNumber()
  status_code!: number;
  /**
   *
   * @type {string}
   * @memberof OcpiResponseDTO
   */
  @IsString()
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
  data?: T;

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
