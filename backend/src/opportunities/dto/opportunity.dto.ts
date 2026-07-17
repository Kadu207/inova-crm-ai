import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpportunityStatus } from '@prisma/client';

export class CreateOpportunityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  pipelineId!: string;

  @ApiProperty()
  @IsString()
  stageId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactId?: string;
}

export class UpdateOpportunityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional({ enum: OpportunityStatus })
  @IsOptional()
  @IsEnum(OpportunityStatus)
  status?: OpportunityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;
}
