import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus } from '@prisma/client';

export class CreateConversationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  chatwootId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  chatwootAccountId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactId?: string;
}

/** Payload from n8n Chatwoot sync-conversation workflow. */
export class SyncConversationDto {
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
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  assigneeId?: number;

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
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadId?: string;

  /** Evolution jid / Chatwoot identifier / future Meta BSUID */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappExternalId?: string;
}
