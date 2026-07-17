import { Injectable, NotFoundException } from '@nestjs/common';
import { Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Task[]> {
    return this.prisma.task.findMany({ where: { tenantId }, orderBy: { dueDate: 'asc' } });
  }

  async findOne(tenantId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(tenantId: string, dto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        opportunityId: dto.opportunityId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.findOne(tenantId, id);
    return this.prisma.task.update({ where: { id }, data: dto });
  }
}
