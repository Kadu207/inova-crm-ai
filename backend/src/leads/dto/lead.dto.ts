import {
  Allow,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource, LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}

export class UpdateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}

export class QualifyLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;
}

/** Payload from n8n Chatwoot lead-inbound workflow. */
export class InboundLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  accountId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  conversationId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  /** Evolution jid / Chatwoot identifier / future Meta BSUID */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappExternalId?: string;

  /** Raw Chatwoot channel, e.g. Channel::Telegram. API normalizes it. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  /** Chatwoot sender identifier. API routes Telegram vs WhatsApp. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  senderIdentifier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telegramUsername?: string;

  /** Chatwoot message id — unique per tenant for idempotent replay */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  messageId?: number;

  /** Chatwoot message_type: 0 incoming, 1 outgoing, 2 activity */
  @ApiPropertyOptional()
  @IsOptional()
  @Allow()
  messageType?: string | number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sentAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  private?: boolean;

  /** Attachment metadata from Chatwoot (file_type / data_url) — not downloaded */
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  attachments?: Record<string, unknown>[];
}

export class ConvertLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;
}
