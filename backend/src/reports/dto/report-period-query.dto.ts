import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/** Query params for report period (ISO date or datetime). */
export class ReportPeriodQueryDto {
  @ApiPropertyOptional({
    description: 'Period start (ISO 8601). Default: now - 30 days',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Period end (ISO 8601). Default: now',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Optional pipeline filter' })
  @IsOptional()
  @IsString()
  pipelineId?: string;
}
