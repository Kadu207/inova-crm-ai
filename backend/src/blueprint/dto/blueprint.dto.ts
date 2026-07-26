import { IsArray, IsOptional, IsString, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlueprintTransitionDto {
  @ApiProperty()
  @IsString()
  fromStageId!: string;

  @ApiProperty()
  @IsString()
  toStageId!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  requiredFieldKeys?: string[];
}

export class UpdateBlueprintTransitionDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  requiredFieldKeys?: string[];
}
