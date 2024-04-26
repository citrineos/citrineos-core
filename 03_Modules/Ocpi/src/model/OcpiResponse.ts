import {IsDate, IsNumber, IsString} from "class-validator";

export class OcpiResponse<T> {

    @IsNumber()
    status_code: number;
    /**
     *
     * @type {string}
     * @memberof OcpiResponseDTO
     */
    @IsString()
    status_message?: string;
    /**
     *
     * @type {object}
     * @memberof OcpiResponseDTO
     */
    data?: T;
    /**
     *
     * @type {string}
     * @memberof OcpiResponseDTO
     */
    @IsDate()
    timestamp: Date;
}
