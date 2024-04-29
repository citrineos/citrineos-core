export class AuthorizationQuerySchema {
    @IsNotEmpty()
    @IsString()
    Authorization!: string;
}
