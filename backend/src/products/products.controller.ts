import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateProductBody,
  CreateProductSizeBody,
  UpdateProductBody,
  UpdateProductSizeBody,
} from './dto';
import { Product } from './product.types';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  list(): Promise<Product[]> {
    return this.productsService.list();
  }

  @Post()
  create(@Body() body: CreateProductBody): Promise<Product> {
    return this.productsService.create(body);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductBody,
  ): Promise<Product> {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  archive(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.archive(id);
  }

  @Post(':id/sizes')
  createSize(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateProductSizeBody,
  ): Promise<Product> {
    return this.productsService.createSize(id, body);
  }

  @Patch(':id/sizes/:sizeCode')
  updateSize(
    @Param('id', ParseIntPipe) id: number,
    @Param('sizeCode') sizeCode: string,
    @Body() body: UpdateProductSizeBody,
  ): Promise<Product> {
    return this.productsService.updateSize(id, sizeCode, body);
  }

  @Delete(':id/sizes/:sizeCode')
  deleteSize(
    @Param('id', ParseIntPipe) id: number,
    @Param('sizeCode') sizeCode: string,
  ): Promise<Product> {
    return this.productsService.deleteSize(id, sizeCode);
  }
}
