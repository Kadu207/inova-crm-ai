import { Injectable } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { LeadsService } from '../leads/leads.service';

export interface QualifyLeadResult {
  leadId: string;
  score: number;
  status: LeadStatus;
  suggestion: string;
}

export interface SuggestNextStepResult {
  entityType: string;
  entityId: string;
  suggestedAction: string;
  confidence: number;
}

@Injectable()
export class AiToolbeltService {
  constructor(private readonly leadsService: LeadsService) {}

  async qualifyLead(tenantId: string, leadId: string): Promise<QualifyLeadResult> {
    const lead = await this.leadsService.qualify(tenantId, leadId, 75);
    return {
      leadId: lead.id,
      score: lead.score,
      status: lead.status,
      suggestion: 'Schedule discovery call within 24h',
    };
  }

  suggestNextStep(entityType: string, entityId: string): SuggestNextStepResult {
    const suggestions: Record<string, string> = {
      lead: 'Qualify lead and assign to sales rep',
      opportunity: 'Move to next pipeline stage or schedule follow-up',
      conversation: 'Resolve or escalate to human agent',
    };

    return {
      entityType,
      entityId,
      suggestedAction: suggestions[entityType] ?? 'Review entity manually',
      confidence: 0.6,
    };
  }
}
