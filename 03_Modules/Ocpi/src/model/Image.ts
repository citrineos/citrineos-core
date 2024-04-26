import {IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, MaxLength,} from "class-validator";
import {Imagecategory} from "./Imagecategory";


export class Image {
    @IsString()
    @IsUrl()
    @IsNotEmpty()
    url: string;

    @IsString()
    @IsUrl()
    @IsOptional()
    thumbnail?: string | null;

    @IsEnum(Imagecategory)
    @IsNotEmpty()
    category: Imagecategory;

    @MaxLength(4)
    @IsString()
    @IsNotEmpty()
    type: string;

    @Max(99999)
    @IsInt()
    @IsOptional()
    width?: number | null;

    @Max(99999)
    @IsInt()
    @IsOptional()
    height?: number | null;

}
