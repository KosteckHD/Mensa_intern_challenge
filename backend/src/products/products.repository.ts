import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SqlExecutor } from '../shared/sql-executor';
import {
  ProductRow,
  ProductSizeRow,
  ProductWithSizesRow,
} from './product.types';

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
  sizes: Array<{
    sizeCode: string;
    stockTotal: number;
  }>;
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

interface ProductQueryRow extends ProductRow {
  sizes: ProductSizeRow[];
}

@Injectable()
export class ProductsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async list(): Promise<ProductWithSizesRow[]> {
    const result = await this.database.query<ProductRow>(
      `
        SELECT *
        FROM products
        WHERE archived_at IS NULL
        ORDER BY release_at NULLS LAST, created_at DESC
      `,
    );

    return this.attachSizes(result.rows);
  }

  async findById(id: string | number): Promise<ProductWithSizesRow | null> {
    const result = await this.database.query<ProductRow>(
      `
        SELECT *
        FROM products
        WHERE id = $1
          AND archived_at IS NULL
      `,
      [id],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const [product] = await this.attachSizes([row]);
    return product ?? null;
  }

  async create(data: CreateProductData): Promise<ProductWithSizesRow> {
    const productId = await this.database.transaction(async (client) => {
      const result = await client.query<ProductRow>(
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
          RETURNING id
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

      for (const size of data.sizes) {
        await client.query(
          `
            INSERT INTO product_sizes (
              product_id,
              size_code,
              stock_total,
              stock_available,
              stock_reserved,
              stock_sold
            )
            VALUES ($1, $2, $3, $3, 0, 0)
          `,
          [result.rows[0].id, size.sizeCode, size.stockTotal],
        );
      }

      return result.rows[0].id;
    });

    const product = await this.findById(productId);

    if (!product) {
      throw new Error('Failed to load created product.');
    }

    return product;
  }

  async update(
    id: string | number,
    data: UpdateProductData,
  ): Promise<ProductWithSizesRow | null> {
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

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(id);
  }

  async archive(id: string | number): Promise<ProductWithSizesRow | null> {
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

    if (!result.rows[0]) {
      return null;
    }

    const [product] = await this.attachSizes([result.rows[0]]);
    return product ?? null;
  }

  async createSize(
    productId: number,
    sizeCode: string,
    stockTotal: number,
  ): Promise<boolean> {
    return this.database.transaction(async (client) => {
      const product = await client.query(
        `
          SELECT id
          FROM products
          WHERE id = $1
            AND archived_at IS NULL
          FOR UPDATE
        `,
        [productId],
      );

      if (!product.rows[0]) {
        return false;
      }

      await client.query(
        `
          INSERT INTO product_sizes (
            product_id,
            size_code,
            stock_total,
            stock_available,
            stock_reserved,
            stock_sold
          )
          VALUES ($1, $2, $3, $3, 0, 0)
        `,
        [productId, sizeCode, stockTotal],
      );

      await client.query(
        `
          UPDATE products
          SET stock_total = stock_total + $2,
              stock_available = stock_available + $2,
              updated_at = now()
          WHERE id = $1
        `,
        [productId, stockTotal],
      );

      return true;
    });
  }

  async updateSize(
    productId: number,
    sizeCode: string,
    stockTotal: number,
  ): Promise<'updated' | 'not-found' | 'below-allocated'> {
    return this.database.transaction(async (client) => {
      const product = await client.query(
        `
          SELECT id
          FROM products
          WHERE id = $1
            AND archived_at IS NULL
          FOR UPDATE
        `,
        [productId],
      );

      if (!product.rows[0]) {
        return 'not-found';
      }

      const result = await client.query<ProductSizeRow>(
        `
          SELECT *
          FROM product_sizes
          WHERE product_id = $1
            AND size_code = $2
          FOR UPDATE
        `,
        [productId, sizeCode],
      );
      const size = result.rows[0];

      if (!size) {
        return 'not-found';
      }

      if (stockTotal < size.stock_reserved + size.stock_sold) {
        return 'below-allocated';
      }

      const delta = stockTotal - size.stock_total;

      await client.query(
        `
          UPDATE product_sizes
          SET stock_total = $3,
              stock_available = $3 - stock_reserved - stock_sold,
              updated_at = now()
          WHERE product_id = $1
            AND size_code = $2
        `,
        [productId, sizeCode, stockTotal],
      );

      await client.query(
        `
          UPDATE products
          SET stock_total = stock_total + $2,
              stock_available = stock_available + $2,
              updated_at = now()
          WHERE id = $1
        `,
        [productId, delta],
      );

      return 'updated';
    });
  }

  async deleteSize(
    productId: number,
    sizeCode: string,
  ): Promise<'deleted' | 'not-found' | 'allocated'> {
    return this.database.transaction(async (client) => {
      const product = await client.query(
        `
          SELECT id
          FROM products
          WHERE id = $1
            AND archived_at IS NULL
          FOR UPDATE
        `,
        [productId],
      );

      if (!product.rows[0]) {
        return 'not-found';
      }

      const result = await client.query<ProductSizeRow>(
        `
          SELECT *
          FROM product_sizes
          WHERE product_id = $1
            AND size_code = $2
          FOR UPDATE
        `,
        [productId, sizeCode],
      );
      const size = result.rows[0];

      if (!size) {
        return 'not-found';
      }

      if (size.stock_reserved > 0 || size.stock_sold > 0) {
        return 'allocated';
      }

      await client.query(
        `
          DELETE FROM product_sizes
          WHERE product_id = $1
            AND size_code = $2
        `,
        [productId, sizeCode],
      );

      await client.query(
        `
          UPDATE products
          SET stock_total = stock_total - $2,
              stock_available = stock_available - $2,
              updated_at = now()
          WHERE id = $1
        `,
        [productId, size.stock_total],
      );

      return 'deleted';
    });
  }

  async reserveStock(
    executor: SqlExecutor,
    productId: string | number,
    sizeCode: string,
    quantity: number,
  ): Promise<ProductRow | null> {
    const sizeResult = await executor.query<ProductSizeRow>(
      `
        UPDATE product_sizes
        SET
          stock_available = stock_available - $3,
          stock_reserved = stock_reserved + $3,
          updated_at = now()
        WHERE product_id = $1
          AND size_code = $2
          AND stock_available >= $3
        RETURNING *
      `,
      [productId, sizeCode, quantity],
    );

    if (!sizeResult.rows[0]) {
      return null;
    }

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

  private async attachSizes(rows: ProductRow[]): Promise<ProductWithSizesRow[]> {
    if (rows.length === 0) {
      return [];
    }

    const productIds = rows.map((row) => row.id);
    const sizeResult = await this.database.query<ProductSizeRow>(
      `
        SELECT *
        FROM product_sizes
        WHERE product_id = ANY($1)
        ORDER BY size_code ASC
      `,
      [productIds],
    );

    const grouped = new Map<number, ProductSizeRow[]>();

    for (const sizeRow of sizeResult.rows) {
      const sizes = grouped.get(sizeRow.product_id) ?? [];
      sizes.push(sizeRow);
      grouped.set(sizeRow.product_id, sizes);
    }

    return rows.map((row) => ({
      ...row,
      sizes: grouped.get(row.id) ?? [],
    }));
  }
}
