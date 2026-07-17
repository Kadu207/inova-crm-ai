import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantPlan, TenantStatus } from '@prisma/client';

export class OnboardTenantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional({ enum: TenantPlan })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}

export class UpdateQuotasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxLeads?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxStorageMb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAiRequestsDay?: number;
}

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: TenantStatus })
  @IsEnum(TenantStatus)
  status!: TenantStatus;
}
