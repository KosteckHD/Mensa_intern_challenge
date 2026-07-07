import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateProductBody, UpdateProductBody } from './dto';
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
  findById(@Param('id') id: string): Promise<Product> {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductBody,
  ): Promise<Product> {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  archive(@Param('id') id: string): Promise<Product> {
    return this.productsService.archive(id);
  }
}
