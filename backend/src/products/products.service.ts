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
import {
  FOOTWEAR_SIZES,
  isFootwearSize,
} from '../shared/footwear-sizes';
import {
  CreateProductBody,
  CreateProductSizeBody,
  UpdateProductBody,
  UpdateProductSizeBody,
} from './dto';
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

  async findById(id: string | number): Promise<Product> {
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
    const sizes = parseProductSizes(body.sizes, body.stockTotal);
    const stockTotal = sizes.reduce((sum, size) => sum + size.stockTotal, 0);

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
        sizes,
      });

      return mapProduct(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Product with this SKU already exists.');
      }

      throw error;
    }
  }

  async update(id: string | number, body: UpdateProductBody): Promise<Product> {
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

  async archive(id: string | number): Promise<Product> {
    const row = await this.productsRepository.archive(id);

    if (!row) {
      throw new NotFoundException('Product not found.');
    }

    return mapProduct(row);
  }

  async createSize(
    productId: number,
    body: CreateProductSizeBody,
  ): Promise<Product> {
    const sizeCode = parseSizeCode(body.sizeCode);
    const stockTotal = requireNonNegativeInteger(body.stockTotal, 'stockTotal');

    try {
      const created = await this.productsRepository.createSize(
        productId,
        sizeCode,
        stockTotal,
      );

      if (!created) {
        throw new NotFoundException('Product not found.');
      }

      return this.findById(productId);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('This size already exists for the product.');
      }
      throw error;
    }
  }

  async updateSize(
    productId: number,
    sizeCodeParam: string,
    body: UpdateProductSizeBody,
  ): Promise<Product> {
    const sizeCode = parseSizeCode(sizeCodeParam);
    const stockTotal = requireNonNegativeInteger(body.stockTotal, 'stockTotal');
    const result = await this.productsRepository.updateSize(
      productId,
      sizeCode,
      stockTotal,
    );

    if (result === 'not-found') {
      throw new NotFoundException('Product size not found.');
    }
    if (result === 'below-allocated') {
      throw new ConflictException(
        'Stock total cannot be lower than reserved and sold stock.',
      );
    }

    return this.findById(productId);
  }

  async deleteSize(productId: number, sizeCodeParam: string): Promise<Product> {
    const sizeCode = parseSizeCode(sizeCodeParam);
    const result = await this.productsRepository.deleteSize(productId, sizeCode);

    if (result === 'not-found') {
      throw new NotFoundException('Product size not found.');
    }
    if (result === 'allocated') {
      throw new ConflictException(
        'A size with reserved or sold stock cannot be deleted.',
      );
    }

    return this.findById(productId);
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

function parseProductSizes(
  value: unknown,
  legacyStockTotal: unknown,
): Array<{ sizeCode: string; stockTotal: number }> {
  if (value === undefined) {
    return [
      {
        sizeCode: 'EU 42',
        stockTotal: requireNonNegativeInteger(legacyStockTotal, 'stockTotal'),
      },
    ];
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException('sizes must be a non-empty array.');
  }

  const seen = new Set<string>();
  return value.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new BadRequestException(`sizes[${index}] must be an object.`);
    }

    const size = entry as Record<string, unknown>;
    const sizeCode = parseSizeCode(size.sizeCode);
    if (seen.has(sizeCode)) {
      throw new BadRequestException(`Duplicate sizeCode: ${sizeCode}.`);
    }
    seen.add(sizeCode);

    return {
      sizeCode,
      stockTotal: requireNonNegativeInteger(
        size.stockTotal,
        `sizes[${index}].stockTotal`,
      ),
    };
  });
}

function parseSizeCode(value: unknown): string {
  const sizeCode = requireString(value, 'sizeCode');
  if (!isFootwearSize(sizeCode)) {
    throw new BadRequestException(
      `sizeCode must be one of ${FOOTWEAR_SIZES.join(', ')}.`,
    );
  }
  return sizeCode;
}
