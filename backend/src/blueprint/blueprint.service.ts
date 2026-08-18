import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BlueprintTransition, Opportunity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlueprintTransitionDto, UpdateBlueprintTransitionDto } from './dto/blueprint.dto';

/** Whitelist of Opportunity scalars that Blueprint may require on transition. */
export const BLUEPRINT_REQUIRED_FIELD_WHITELIST = [
  'title',
  'value',
  'contactId',
  'assignedToId',
  'expectedCloseDate',
  'leadId',
] as const;

export type BlueprintRequiredField = (typeof BLUEPRINT_REQUIRED_FIELD_WHITELIST)[number];

export const BLUEPRINT_TRANSITION_DENIED = 'BLUEPRINT_TRANSITION_DENIED';
export const BLUEPRINT_REQUIRED_FIELDS = 'BLUEPRINT_REQUIRED_FIELDS';

@Injectable()
export class BlueprintService {
  constructor(private readonly prisma: PrismaService) {}

  listTransitions(tenantId: string, pipelineId: string): Promise<BlueprintTransition[]> {
    return this.prisma.blueprintTransition.findMany({
      where: { tenantId, pipelineId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTransition(
    tenantId: string,
    pipelineId: string,
    dto: CreateBlueprintTransitionDto,
  ): Promise<BlueprintTransition> {
    await this.assertPipeline(tenantId, pipelineId);
    await this.assertStageInPipeline(tenantId, pipelineId, dto.fromStageId);
    await this.assertStageInPipeline(tenantId, pipelineId, dto.toStageId);
    if (dto.fromStageId === dto.toStageId) {
      throw new BadRequestException('fromStageId and toStageId must differ');
    }
    const keys = this.normalizeRequiredKeys(dto.requiredFieldKeys);
    try {
      return await this.prisma.blueprintTransition.create({
        data: {
          tenantId,
          pipelineId,
          fromStageId: dto.fromStageId,
          toStageId: dto.toStageId,
          requiredFieldKeys: keys,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Transition already exists for this stage pair');
      }
      throw err;
    }
  }

  async updateTransition(
    tenantId: string,
    pipelineId: string,
    transitionId: string,
    dto: UpdateBlueprintTransitionDto,
  ): Promise<BlueprintTransition> {
    await this.findTransition(tenantId, pipelineId, transitionId);
    const keys =
      dto.requiredFieldKeys !== undefined
        ? this.normalizeRequiredKeys(dto.requiredFieldKeys)
        : undefined;
    const result = await this.prisma.blueprintTransition.updateMany({
      where: { id: transitionId, tenantId, pipelineId },
      data: keys !== undefined ? { requiredFieldKeys: keys } : {},
    });
    if (result.count === 0) {
      throw new NotFoundException(`Blueprint transition ${transitionId} not found`);
    }
    return this.findTransition(tenantId, pipelineId, transitionId);
  }

  async deleteTransition(
    tenantId: string,
    pipelineId: string,
    transitionId: string,
  ): Promise<void> {
    await this.findTransition(tenantId, pipelineId, transitionId);
    await this.prisma.blueprintTransition.deleteMany({
      where: { id: transitionId, tenantId, pipelineId },
    });
  }

  /**
   * Opt-in: if pipeline has ≥1 transition, enforce edge + required fields.
   * Call only when stage is changing.
   */
  async assertStageTransitionAllowed(
    tenantId: string,
    pipelineId: string,
    fromStageId: string,
    toStageId: string,
    opportunity: Pick<
      Opportunity,
      'title' | 'value' | 'contactId' | 'assignedToId' | 'expectedCloseDate' | 'leadId'
    >,
  ): Promise<void> {
    const count = await this.prisma.blueprintTransition.count({
      where: { tenantId, pipelineId },
    });
    if (count === 0) return;

    const edge = await this.prisma.blueprintTransition.findFirst({
      where: { tenantId, pipelineId, fromStageId, toStageId },
    });
    if (!edge) {
      throw new BadRequestException({
        code: BLUEPRINT_TRANSITION_DENIED,
        message: `Transition from ${fromStageId} to ${toStageId} is not allowed by blueprint`,
      });
    }

    const missing = edge.requiredFieldKeys.filter((key: string) => {
      if (!isBlueprintRequiredField(key)) return false;
      return !hasRequiredValue(opportunity, key);
    });
    if (missing.length > 0) {
      throw new BadRequestException({
        code: BLUEPRINT_REQUIRED_FIELDS,
        message: `Missing required fields for this transition: ${missing.join(', ')}`,
        fields: missing,
      });
    }
  }

  private normalizeRequiredKeys(keys: string[] | undefined): string[] {
    if (!keys?.length) return [];
    const invalid = keys.filter((k) => !isBlueprintRequiredField(k));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid requiredFieldKeys: ${invalid.join(', ')}. Allowed: ${BLUEPRINT_REQUIRED_FIELD_WHITELIST.join(', ')}`,
      );
    }
    return [...new Set(keys)];
  }

  private async assertPipeline(tenantId: string, pipelineId: string): Promise<void> {
    const pipeline = await this.prisma.pipeline.findFirst({ where: { id: pipelineId, tenantId } });
    if (!pipeline) throw new NotFoundException(`Pipeline ${pipelineId} not found`);
  }

  private async assertStageInPipeline(
    tenantId: string,
    pipelineId: string,
    stageId: string,
  ): Promise<void> {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, tenantId, pipelineId },
    });
    if (!stage) {
      throw new BadRequestException(
        `Stage ${stageId} is not part of pipeline ${pipelineId} for this tenant`,
      );
    }
  }

  private async findTransition(
    tenantId: string,
    pipelineId: string,
    transitionId: string,
  ): Promise<BlueprintTransition> {
    const row = await this.prisma.blueprintTransition.findFirst({
      where: { id: transitionId, tenantId, pipelineId },
    });
    if (!row) throw new NotFoundException(`Blueprint transition ${transitionId} not found`);
    return row;
  }
}

function isBlueprintRequiredField(key: string): key is BlueprintRequiredField {
  return (BLUEPRINT_REQUIRED_FIELD_WHITELIST as readonly string[]).includes(key);
}

function hasRequiredValue(
  opportunity: Pick<
    Opportunity,
    'title' | 'value' | 'contactId' | 'assignedToId' | 'expectedCloseDate' | 'leadId'
  >,
  key: BlueprintRequiredField,
): boolean {
  switch (key) {
    case 'title':
      return Boolean(opportunity.title?.trim());
    case 'value':
      return opportunity.value != null && !opportunity.value.equals(0);
    case 'contactId':
      return Boolean(opportunity.contactId);
    case 'assignedToId':
      return Boolean(opportunity.assignedToId);
    case 'expectedCloseDate':
      return Boolean(opportunity.expectedCloseDate);
    case 'leadId':
      return Boolean(opportunity.leadId);
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}
