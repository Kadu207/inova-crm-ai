import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProposalStatus } from '@prisma/client';

export class CreateProposalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  opportunityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateProposalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ProposalStatus })
  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalValue?: number;
}
