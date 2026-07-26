import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CustomFieldModule, CustomFieldType } from '@prisma/client';

export class CreateCustomFieldDto {
  @IsEnum(CustomFieldModule)
  module!: CustomFieldModule;

  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_]*$/)
  apiName!: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsEnum(CustomFieldType)
  type!: CustomFieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

export class UpdateCustomFieldDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}
