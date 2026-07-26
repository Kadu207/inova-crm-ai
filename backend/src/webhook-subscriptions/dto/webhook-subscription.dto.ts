import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, ArrayMinSize } from 'class-validator';

export class CreateWebhookSubscriptionDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  secret!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  eventTypes!: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateWebhookSubscriptionDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
