import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetConfigDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ description: 'JSON-serializable value' })
  value!: unknown;
}
