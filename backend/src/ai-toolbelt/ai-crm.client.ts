import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AiMessagePayload = {
  direction: string;
  content?: string | null;
  body?: string | null;
};

export type SummarizeAiResult = {
  tenant_id: string;
  message_count: number;
  topics: string[];
  summary: string;
  sentiment: string;
};

export type SuggestReplyAiResult = {
  tenant_id: string;
  draft: string;
  confidence: number;
  channel?: string | null;
  disclaimer?: string;
};

export type SuggestNextStepAiResult = {
  tenant_id: string;
  stage: string;
  suggested_action: string;
  priority: string;
  channel?: string | null;
};

@Injectable()
export class AiCrmClient {
  private readonly logger = new Logger(AiCrmClient.name);

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    const raw = this.config.get<string>('AI_BASE_URL')?.trim();
    return (raw && raw.length > 0 ? raw : 'http://127.0.0.1:9402').replace(/\/$/, '');
  }

  private token(): string | undefined {
    const token = this.config.get<string>('AI_API_TOKEN')?.trim();
    return token && token.length > 0 ? token : undefined;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const token = this.token();
    if (!token) {
      throw new ServiceUnavailableException('AI_API_TOKEN is not configured');
    }

    const url = `${this.baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.warn(`ai-crm unreachable at ${url}: ${(err as Error).message}`);
      throw new ServiceUnavailableException('AI service unreachable');
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.warn(`ai-crm ${path} → ${response.status}: ${text.slice(0, 200)}`);
      throw new BadGatewayException(`AI service error (${response.status})`);
    }

    return (await response.json()) as T;
  }

  summarize(tenantId: string, messages: AiMessagePayload[]): Promise<SummarizeAiResult> {
    return this.post<SummarizeAiResult>('/v1/summarize-conversation', {
      tenant_id: tenantId,
      messages,
    });
  }

  suggestReply(
    tenantId: string,
    messages: AiMessagePayload[],
    channel?: string | null,
  ): Promise<SuggestReplyAiResult> {
    return this.post<SuggestReplyAiResult>('/v1/suggest-reply', {
      tenant_id: tenantId,
      messages,
      channel: channel ?? undefined,
    });
  }

  suggestNextStep(
    tenantId: string,
    context: Record<string, unknown>,
  ): Promise<SuggestNextStepAiResult> {
    return this.post<SuggestNextStepAiResult>('/v1/suggest-next-step', {
      tenant_id: tenantId,
      context,
    });
  }
}
