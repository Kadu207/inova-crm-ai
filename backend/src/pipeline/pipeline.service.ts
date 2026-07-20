import { Injectable, NotFoundException } from '@nestjs/common';
import { Pipeline, PipelineStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePipelineDto, CreateStageDto } from './dto/pipeline.dto';

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Pipeline[]> {
    return this.prisma.pipeline.findMany({
      where: { tenantId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Pipeline & { stages: PipelineStage[] }> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, tenantId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    return pipeline;
  }

  create(tenantId: string, dto: CreatePipelineDto): Promise<Pipeline> {
    return this.prisma.pipeline.create({ data: { tenantId, ...dto } });
  }

  async findDefault(tenantId: string): Promise<(Pipeline & { stages: PipelineStage[] }) | null> {
    return this.prisma.pipeline.findFirst({
      where: { tenantId, isDefault: true },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  async addStage(
    tenantId: string,
    pipelineId: string,
    dto: CreateStageDto,
  ): Promise<PipelineStage> {
    await this.findOne(tenantId, pipelineId);
    return this.prisma.pipelineStage.create({
      data: { tenantId, pipelineId, ...dto },
    });
  }
}
