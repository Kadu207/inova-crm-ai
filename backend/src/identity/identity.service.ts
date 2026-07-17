import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.prisma.user.findMany({ where: { tenantId } });
    return users.map(({ passwordHash: _hash, ...user }) => user);
  }

  async findOne(tenantId: string, id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const { passwordHash: _hash, ...safe } = user;
    return safe;
  }

  async create(tenantId: string, dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) throw new ConflictException('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { tenantId, email: dto.email, name: dto.name, passwordHash, role: dto.role },
    });
    const { passwordHash: _hash, ...safe } = user;
    return safe;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    await this.findOne(tenantId, id);
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    const { passwordHash: _hash, ...safe } = user;
    return safe;
  }
}
