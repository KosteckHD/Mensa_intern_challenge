import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SqlExecutor } from '../shared/sql-executor';
import { ProductRow } from './product.types';

export interface CreateProductData {
  sku: string;
  slug: string;
  brand: string;
  model: string;
  name: string;
  colorway: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  releaseAt: Date | null;
  stockTotal: number;
}

export interface UpdateProductData {
  sku?: string;
  slug?: string;
  brand?: string;
  model?: string;
  name?: string;
  colorway?: string;
  description?: string | null;
  priceCents?: number;
  imageUrl?: string | null;
  releaseAt?: Date | null;
}

@Injectable()
export class ProductsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async list(): Promise<ProductRow[]> {
    const result = await this.database.query<ProductRow>(
      `
        SELECT *
        FROM products
        WHERE archived_at IS NULL
        ORDER BY release_at NULLS LAST, created_at DESC
      `,
    );

    return result.rows;
  }

  async findById(id: string): Promise<ProductRow | null> {
    const result = await this.database.query<ProductRow>(
      `
        SELECT *
        FROM products
        WHERE id = $1
          AND archived_at IS NULL
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async create(data: CreateProductData): Promise<ProductRow> {
    const result = await this.database.query<ProductRow>(
      `
        INSERT INTO products (
          sku,
          slug,
          brand,
          model,
          name,
          colorway,
          description,
          price_cents,
          image_url,
          release_at,
          stock_total,
          stock_available,
          stock_reserved,
          stock_sold
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, 0, 0)
        RETURNING *
      `,
      [
        data.sku,
        data.slug,
        data.brand,
        data.model,
        data.name,
        data.colorway,
        data.description,
        data.priceCents,
        data.imageUrl,
        data.releaseAt,
        data.stockTotal,
      ],
    );

    return result.rows[0];
  }

  async update(id: string, data: UpdateProductData): Promise<ProductRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const addField = (column: string, value: unknown): void => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };

    if (data.sku !== undefined) addField('sku', data.sku);
    if (data.slug !== undefined) addField('slug', data.slug);
    if (data.brand !== undefined) addField('brand', data.brand);
    if (data.model !== undefined) addField('model', data.model);
    if (data.name !== undefined) addField('name', data.name);
    if (data.colorway !== undefined) addField('colorway', data.colorway);
    if (data.description !== undefined) addField('description', data.description);
    if (data.priceCents !== undefined) addField('price_cents', data.priceCents);
    if (data.imageUrl !== undefined) addField('image_url', data.imageUrl);
    if (data.releaseAt !== undefined) addField('release_at', data.releaseAt);

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.database.query<ProductRow>(
      `
        UPDATE products
        SET ${fields.join(', ')}, updated_at = now()
        WHERE id = $${values.length}
          AND archived_at IS NULL
        RETURNING *
      `,
      values,
    );

    return result.rows[0] ?? null;
  }

  async archive(id: string): Promise<ProductRow | null> {
    const result = await this.database.query<ProductRow>(
      `
        UPDATE products
        SET archived_at = now(), updated_at = now()
        WHERE id = $1
          AND archived_at IS NULL
        RETURNING *
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async reserveStock(
    executor: SqlExecutor,
    productId: string,
    quantity: number,
  ): Promise<ProductRow | null> {
    const result = await executor.query<ProductRow>(
      `
        UPDATE products
        SET
          stock_available = stock_available - $2,
          stock_reserved = stock_reserved + $2,
          updated_at = now()
        WHERE id = $1
          AND archived_at IS NULL
          AND stock_available >= $2
        RETURNING *
      `,
      [productId, quantity],
    );

    return result.rows[0] ?? null;
  }
}
