import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SqlExecutor } from '../shared/sql-executor';
import { OrderRow, OrderStatus } from './order.types';

export interface CreateOrderData {
  orderNumber: string;
  reservationId: string | number;
  productId: string | number;
  customerEmail: string | null;
  quantity: number;
  shoeSize: string;
  unitPriceCents: number;
  shippingCents: number;
  firstName: string;
  lastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentReference: string;
}

@Injectable()
export class OrdersRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async list(filters: {
    productId?: number;
    reservationId?: number;
    status?: OrderStatus;
  }): Promise<OrderRow[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.productId) {
      values.push(filters.productId);
      conditions.push(`product_id = $${values.length}`);
    }

    if (filters.reservationId) {
      values.push(filters.reservationId);
      conditions.push(`reservation_id = $${values.length}`);
    }

    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await this.database.query<OrderRow>(
      `
        SELECT *
        FROM orders
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows;
  }

  async findById(id: string | number): Promise<OrderRow | null> {
    const result = await this.database.query<OrderRow>(
      `
        SELECT *
        FROM orders
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async create(executor: SqlExecutor, data: CreateOrderData): Promise<OrderRow> {
    const result = await executor.query<OrderRow>(
      `
        INSERT INTO orders (
          order_number,
          reservation_id,
          product_id,
          customer_email,
          quantity,
          shoe_size,
          unit_price_cents,
          shipping_cents,
          total_price_cents,
          first_name,
          last_name,
          shipping_address,
          shipping_city,
          shipping_postal_code,
          payment_reference,
          status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $5::integer * $7::integer + $8::integer,
          $9, $10, $11, $12, $13, $14, 'confirmed'
        )
        RETURNING *
      `,
      [
        data.orderNumber,
        data.reservationId,
        data.productId,
        data.customerEmail,
        data.quantity,
        data.shoeSize,
        data.unitPriceCents,
        data.shippingCents,
        data.firstName,
        data.lastName,
        data.shippingAddress,
        data.shippingCity,
        data.shippingPostalCode,
        data.paymentReference,
      ],
    );

    return result.rows[0];
  }
}
