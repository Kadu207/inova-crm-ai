import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
} from './dto/webhook-subscription.dto';
import { WebhookSubscriptionsService } from './webhook-subscriptions.service';

@ApiTags('webhook-subscriptions')
@ApiBearerAuth()
@Controller('webhook-subscriptions')
export class WebhookSubscriptionsController {
  constructor(private readonly service: WebhookSubscriptionsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@TenantId() tenantId: string, @Body() dto: CreateWebhookSubscriptionDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete webhook subscription' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
