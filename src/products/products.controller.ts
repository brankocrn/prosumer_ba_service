import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List active products, optionally filtered by partner' })
  @ApiQuery({ name: 'partnerId', required: false, type: Number })
  findAll(@Query('partnerId') partnerId?: string) {
    return this.service.findAll(partnerId ? +partnerId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  findOne(@Param('id') id: string) { return this.service.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Create product (must belong to a partner)' })
  create(@Body() dto: CreateProductDto) { return this.service.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.service.update(+id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete product' })
  remove(@Param('id') id: string) { return this.service.remove(+id); }
}
