import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ProductRow } from '../products/product.types';
import { SqlExecutor } from '../shared/sql-executor';
import { ReservationRow, ReservationStatus } from './reservation.types';

export interface CreateReservationData {
  productId: string;
  customerEmail: string | null;
  quantity: number;
  expiresAt: Date;
}

@Injectable()
export class ReservationsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async list(filters: {
    productId?: string;
    status?: ReservationStatus;
  }): Promise<ReservationRow[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.productId) {
      values.push(filters.productId);
      conditions.push(`product_id = $${values.length}`);
    }

    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await this.database.query<ReservationRow>(
      `
        SELECT *
        FROM reservations
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows;
  }

  async findById(id: string): Promise<ReservationRow | null> {
    const result = await this.database.query<ReservationRow>(
      `
        SELECT *
        FROM reservations
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async findByIdForUpdate(
    executor: SqlExecutor,
    id: string,
  ): Promise<ReservationRow | null> {
    const result = await executor.query<ReservationRow>(
      `
        SELECT *, expires_at <= now() AS is_expired
        FROM reservations
        WHERE id = $1
        FOR UPDATE
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async create(
    executor: SqlExecutor,
    data: CreateReservationData,
  ): Promise<ReservationRow> {
    const result = await executor.query<ReservationRow>(
      `
        INSERT INTO reservations (
          product_id,
          customer_email,
          quantity,
          status,
          expires_at
        )
        VALUES ($1, $2, $3, 'active', $4)
        RETURNING *
      `,
      [data.productId, data.customerEmail, data.quantity, data.expiresAt],
    );

    return result.rows[0];
  }

  async complete(
    executor: SqlExecutor,
    id: string,
  ): Promise<ReservationRow> {
    const result = await executor.query<ReservationRow>(
      `
        UPDATE reservations
        SET status = 'completed',
            completed_at = now(),
            updated_at = now()
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );

    return result.rows[0];
  }

  async cancel(executor: SqlExecutor, id: string): Promise<ReservationRow> {
    const result = await executor.query<ReservationRow>(
      `
        UPDATE reservations
        SET status = 'cancelled',
            cancelled_at = now(),
            updated_at = now()
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );

    return result.rows[0];
  }

  async expireOne(executor: SqlExecutor, id: string): Promise<ReservationRow> {
    const result = await executor.query<ReservationRow>(
      `
        UPDATE reservations
        SET status = 'expired',
            updated_at = now()
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );

    return result.rows[0];
  }

  async moveReservedToSold(
    executor: SqlExecutor,
    productId: string,
    quantity: number,
  ): Promise<ProductRow | null> {
    const result = await executor.query<ProductRow>(
      `
        UPDATE products
        SET stock_reserved = stock_reserved - $2,
            stock_sold = stock_sold + $2,
            updated_at = now()
        WHERE id = $1
          AND stock_reserved >= $2
        RETURNING *
      `,
      [productId, quantity],
    );

    return result.rows[0] ?? null;
  }

  async moveReservedToAvailable(
    executor: SqlExecutor,
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    const result = await executor.query(
      `
        UPDATE products
        SET stock_reserved = stock_reserved - $2,
            stock_available = stock_available + $2,
            updated_at = now()
        WHERE id = $1
          AND stock_reserved >= $2
      `,
      [productId, quantity],
    );

    return result.rowCount === 1;
  }

  async expireActiveReservations(executor: SqlExecutor): Promise<number> {
    const result = await executor.query<{ expired_count: string }>(
      `
        WITH expired AS (
          UPDATE reservations
          SET status = 'expired',
              updated_at = now()
          WHERE status = 'active'
            AND expires_at <= now()
          RETURNING product_id, quantity
        ),
        grouped AS (
          SELECT product_id, sum(quantity)::integer AS quantity
          FROM expired
          GROUP BY product_id
        ),
        restored AS (
          UPDATE products p
          SET stock_available = stock_available + g.quantity,
              stock_reserved = stock_reserved - g.quantity,
              updated_at = now()
          FROM grouped g
          WHERE p.id = g.product_id
          RETURNING g.quantity
        )
        SELECT COALESCE(sum(quantity), 0)::text AS expired_count
        FROM restored
      `,
    );

    return Number(result.rows[0]?.expired_count ?? 0);
  }
}
