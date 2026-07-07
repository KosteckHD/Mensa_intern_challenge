import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  optionalDate,
  optionalString,
  requireNonNegativeInteger,
  requireString,
} from '../shared/validation';
import { CreateProductBody, UpdateProductBody } from './dto';
import { mapProduct, Product } from './product.types';
import { ProductsRepository, UpdateProductData } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(ProductsRepository)
    private readonly productsRepository: ProductsRepository,
  ) {}

  async list(): Promise<Product[]> {
    const rows = await this.productsRepository.list();
    return rows.map(mapProduct);
  }

  async findById(id: string): Promise<Product> {
    const row = await this.productsRepository.findById(id);

    if (!row) {
      throw new NotFoundException('Product not found.');
    }

    return mapProduct(row);
  }

  async create(body: CreateProductBody): Promise<Product> {
    const sku = requireString(body.sku, 'sku').toUpperCase();
    const brand = requireString(body.brand, 'brand');
    const model = requireString(body.model, 'model');
    const name = requireString(body.name, 'name');
    const colorway = requireString(body.colorway, 'colorway');
    const priceCents = requireNonNegativeInteger(body.priceCents, 'priceCents');
    const stockTotal = requireNonNegativeInteger(body.stockTotal, 'stockTotal');

    try {
      const row = await this.productsRepository.create({
        sku,
        slug: buildSlug([brand, model, colorway, sku]),
        brand,
        model,
        name,
        colorway,
        description: optionalString(body.description, 'description'),
        priceCents,
        imageUrl: optionalString(body.imageUrl, 'imageUrl'),
        releaseAt: optionalDate(body.releaseAt, 'releaseAt'),
        stockTotal,
      });

      return mapProduct(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Product with this SKU already exists.');
      }

      throw error;
    }
  }

  async update(id: string, body: UpdateProductBody): Promise<Product> {
    const data: UpdateProductData = {};
    let shouldRegenerateSlug = false;

    if (body.sku !== undefined) {
      data.sku = requireString(body.sku, 'sku').toUpperCase();
      shouldRegenerateSlug = true;
    }
    if (body.brand !== undefined) {
      data.brand = requireString(body.brand, 'brand');
      shouldRegenerateSlug = true;
    }
    if (body.model !== undefined) {
      data.model = requireString(body.model, 'model');
      shouldRegenerateSlug = true;
    }
    if (body.name !== undefined) data.name = requireString(body.name, 'name');
    if (body.colorway !== undefined) {
      data.colorway = requireString(body.colorway, 'colorway');
      shouldRegenerateSlug = true;
    }
    if (body.description !== undefined) {
      data.description = optionalString(body.description, 'description');
    }
    if (body.priceCents !== undefined) {
      data.priceCents = requireNonNegativeInteger(body.priceCents, 'priceCents');
    }
    if (body.imageUrl !== undefined) {
      data.imageUrl = optionalString(body.imageUrl, 'imageUrl');
    }
    if (body.releaseAt !== undefined) {
      data.releaseAt = optionalDate(body.releaseAt, 'releaseAt');
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field must be provided.');
    }

    if (shouldRegenerateSlug) {
      const current = await this.findById(id);
      data.slug = buildSlug([
        data.brand ?? current.brand,
        data.model ?? current.model,
        data.colorway ?? current.colorway,
        data.sku ?? current.sku,
      ]);
    }

    try {
      const row = await this.productsRepository.update(id, data);

      if (!row) {
        throw new NotFoundException('Product not found.');
      }

      return mapProduct(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Product with this SKU already exists.');
      }

      throw error;
    }
  }

  async archive(id: string): Promise<Product> {
    const row = await this.productsRepository.archive(id);

    if (!row) {
      throw new NotFoundException('Product not found.');
    }

    return mapProduct(row);
  }
}

function buildSlug(parts: string[]): string {
  return parts
    .join(' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}
