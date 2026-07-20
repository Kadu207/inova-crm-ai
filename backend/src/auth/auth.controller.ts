import { Controller, Post, Body, Get, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public, JwtPayload } from '../common/constants';
import { CurrentUser } from '../common/decorators/tenant.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new tenant and admin user' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email, password and tenant slug' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user + tenant' })
  async me(@CurrentUser() user: JwtPayload): Promise<AuthResponseDto> {
    if (!user.tenantId) {
      throw new UnauthorizedException('Tenant context required');
    }
    const profile = await this.authService.me(user.sub, user.tenantId);
    if (!profile) {
      throw new UnauthorizedException('User not found');
    }
    return profile;
  }
}
