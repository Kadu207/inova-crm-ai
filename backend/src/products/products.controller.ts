import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.productsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.productsService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(tenantId, id, dto);
  }
}
