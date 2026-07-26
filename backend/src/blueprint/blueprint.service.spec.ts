import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { BlueprintService, BLUEPRINT_TRANSITION_DENIED } from './blueprint.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BlueprintService', () => {
  let service: BlueprintService;
  let prisma: {
    blueprintTransition: {
      count: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    pipeline: { findFirst: jest.Mock };
    pipelineStage: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      blueprintTransition: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      pipeline: { findFirst: jest.fn() },
      pipelineStage: { findFirst: jest.fn() },
    };
    service = new BlueprintService(prisma as unknown as PrismaService);
  });

  it('allows any stage when pipeline has no blueprint transitions', async () => {
    prisma.blueprintTransition.count.mockResolvedValue(0);
    await expect(
      service.assertStageTransitionAllowed('t1', 'p1', 's1', 's2', {
        title: 'Deal',
        value: new Decimal(0),
        contactId: null,
        assignedToId: null,
        expectedCloseDate: null,
        leadId: null,
      }),
    ).resolves.toBeUndefined();
    expect(prisma.blueprintTransition.findFirst).not.toHaveBeenCalled();
  });

  it('denies transition missing from graph', async () => {
    prisma.blueprintTransition.count.mockResolvedValue(1);
    prisma.blueprintTransition.findFirst.mockResolvedValue(null);
    await expect(
      service.assertStageTransitionAllowed('t1', 'p1', 's1', 's9', {
        title: 'Deal',
        value: new Decimal(100),
        contactId: 'c1',
        assignedToId: null,
        expectedCloseDate: null,
        leadId: null,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: BLUEPRINT_TRANSITION_DENIED }),
    });
  });

  it('requires fields listed on allowed edge', async () => {
    prisma.blueprintTransition.count.mockResolvedValue(1);
    prisma.blueprintTransition.findFirst.mockResolvedValue({
      id: 'bt1',
      requiredFieldKeys: ['contactId', 'value'],
    });
    await expect(
      service.assertStageTransitionAllowed('t1', 'p1', 's1', 's2', {
        title: 'Deal',
        value: new Decimal(0),
        contactId: null,
        assignedToId: null,
        expectedCloseDate: null,
        leadId: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes listTransitions by tenantId', async () => {
    prisma.blueprintTransition.findMany.mockResolvedValue([]);
    await service.listTransitions('tenant-a', 'pipe-1');
    expect(prisma.blueprintTransition.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', pipelineId: 'pipe-1' },
      orderBy: { createdAt: 'asc' },
    });
  });
});
