import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { FilterNode } from '../filter-engine/filter-engine';

export class AdvancedSearchDto {
  @ApiPropertyOptional({ description: 'Structured FilterNode (and/or/leaf)' })
  @IsOptional()
  @IsObject()
  filter?: FilterNode;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ example: '-createdAt' })
  @IsOptional()
  @IsString()
  sort?: string;
}
