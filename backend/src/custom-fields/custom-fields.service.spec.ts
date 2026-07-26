import { Test } from '@nestjs/testing';
import { CustomFieldsService } from './custom-fields.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomFieldType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('CustomFieldsService', () => {
  let service: CustomFieldsService;
  let prisma: { customFieldDefinition: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { customFieldDefinition: { findMany: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [CustomFieldsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(CustomFieldsService);
  });

  it('validateCustomFields rejects unknown keys', async () => {
    prisma.customFieldDefinition.findMany.mockResolvedValue([
      { apiName: 'score_tier', type: CustomFieldType.TEXT, required: false },
    ]);
    await expect(service.validateCustomFields('t1', 'LEAD', { other: 'x' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('validateCustomFields coerces number', async () => {
    prisma.customFieldDefinition.findMany.mockResolvedValue([
      { apiName: 'budget', type: CustomFieldType.NUMBER, required: true },
    ]);
    const result = await service.validateCustomFields('t1', 'LEAD', { budget: '42' });
    expect(result).toEqual({ budget: 42 });
  });
});
