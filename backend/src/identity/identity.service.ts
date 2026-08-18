import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
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
    this.assertAssignableRole(dto.role);
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) throw new ConflictException('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role as UserRole | undefined,
      },
    });
    const { passwordHash: _hash, ...safe } = user;
    return safe;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    this.assertAssignableRole(dto.role);
    await this.findOne(tenantId, id);
    const result = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: {
        name: dto.name,
        role: dto.role as UserRole | undefined,
      },
    });
    if (result.count === 0) throw new NotFoundException(`User ${id} not found`);
    return this.findOne(tenantId, id);
  }

  private assertAssignableRole(role: string | undefined): void {
    if (role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN cannot be assigned via identity API');
    }
  }
}
