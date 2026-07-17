import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'acme-corp', description: 'Tenant slug' })
  @IsString()
  @IsNotEmpty()
  tenantSlug!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  tenantSlug!: string;

  @ApiProperty({ example: 'Admin User' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  tenantSlug!: string;

  @ApiProperty()
  tenantName!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  role!: string;
}
