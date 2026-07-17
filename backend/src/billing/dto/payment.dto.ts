import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
