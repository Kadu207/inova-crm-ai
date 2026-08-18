import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Roles assignable via identity API — excludes SUPER_ADMIN. */
export enum AssignableUserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES = 'SALES',
  SUPPORT = 'SUPPORT',
  VIEWER = 'VIEWER',
}

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ enum: AssignableUserRole })
  @IsOptional()
  @IsEnum(AssignableUserRole)
  role?: AssignableUserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: AssignableUserRole })
  @IsOptional()
  @IsEnum(AssignableUserRole)
  role?: AssignableUserRole;
}
