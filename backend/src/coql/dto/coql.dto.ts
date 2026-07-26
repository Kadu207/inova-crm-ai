import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CoqlQueryDto {
  @ApiProperty({
    example: "SELECT id, title FROM Leads WHERE status = 'NEW' LIMIT 50",
  })
  @IsString()
  @MinLength(10)
  q!: string;
}
