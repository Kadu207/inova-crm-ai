import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { JwtPayload } from '../common/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });
    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const tenant = await this.prisma.tenant.create({
      data: {
        slug: dto.tenantSlug,
        name: dto.tenantName,
        users: {
          create: {
            email: dto.email,
            name: dto.name,
            passwordHash,
            role: UserRole.ADMIN,
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    return this.buildAuthResponse(
      user.id,
      user.email,
      user.name,
      tenant.id,
      tenant.slug,
      tenant.name,
      user.role,
    );
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });
    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: { tenantId: tenant.id, email: dto.email },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(
      user.id,
      user.email,
      user.name,
      tenant.id,
      tenant.slug,
      tenant.name,
      user.role,
    );
  }

  async me(userId: string, tenantId: string): Promise<AuthResponseDto | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { tenant: true },
    });
    if (!user || !user.isActive) {
      return null;
    }
    return this.buildAuthResponse(
      user.id,
      user.email,
      user.name,
      user.tenant.id,
      user.tenant.slug,
      user.tenant.name,
      user.role,
    );
  }

  private buildAuthResponse(
    userId: string,
    email: string,
    userName: string,
    tenantId: string,
    tenantSlug: string,
    tenantName: string,
    role: UserRole,
  ): AuthResponseDto {
    const payload: JwtPayload = { sub: userId, email, tenantId, role };
    return {
      accessToken: this.jwtService.sign(payload),
      tenantId,
      tenantSlug,
      tenantName,
      userId,
      userName,
      email,
      role,
    };
  }
}
