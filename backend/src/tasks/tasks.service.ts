import { Injectable, NotFoundException } from '@nestjs/common';
import { Task, TaskStatus, Prisma } from '@prisma/client';
import { actorCreateFields, actorUpdateFields, detailOwnerInclude } from '../common/audit-fields';
import { listResult, ListQueryInput, ListResult, parseListQuery } from '../common/list-query';
import { notDeleted } from '../common/soft-delete';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: ListQueryInput = {}): Promise<ListResult<Task>> {
    const q = parseListQuery({ ...query, sort: query.sort ?? 'dueDate' });
    const where: Prisma.TaskWhereInput = {
      tenantId,
      ...notDeleted,
      ...(q.status ? { status: q.status as TaskStatus } : {}),
      ...(q.assignedToId ? { assignedToId: q.assignedToId } : {}),
      ...(q.q ? { title: { contains: q.q, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { [q.sortField]: q.sortDir },
        skip: q.skip,
        take: q.pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);
    return listResult(data, total, q.page, q.pageSize);
  }

  async findOne(tenantId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId, ...notDeleted },
      include: detailOwnerInclude,
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(tenantId: string, dto: CreateTaskDto, actorUserId?: string): Promise<Task> {
    return this.prisma.task.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        opportunityId: dto.opportunityId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        ...actorCreateFields(actorUserId),
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateTaskDto,
    actorUserId?: string,
  ): Promise<Task> {
    await this.findOne(tenantId, id);
    const result = await this.prisma.task.updateMany({
      where: { id, tenantId },
      data: { ...dto, ...actorUpdateFields(actorUserId) },
    });
    if (result.count === 0) throw new NotFoundException(`Task ${id} not found`);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.task.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }
}
