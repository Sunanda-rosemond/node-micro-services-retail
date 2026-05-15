import { pool } from '../db/pool';
import { Order } from '../models/order';

// export class OrderRepository {
//   private orders: Order[] = [];

//   findAll(): Order[] {
//     return this.orders;
//   }

//   findById(id: string): Order | undefined {
//     return this.orders.find((order) => order.id === id);
//   }

//   create(order: Order): Order {
//     this.orders.push(order);
//     return order;
//   }
// }

export class OrderRepository {
  async init(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        cart_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `);
    await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_cart_id
  ON orders(cart_id);
`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL
      );
    `);
  }
  async findAll(): Promise<Order[]> {
    const ordersResult = await pool.query(`
      SELECT id, cart_id, status, created_at
      FROM orders
      ORDER BY created_at DESC
    `);

    const orders: Order[] = [];

    for (const row of ordersResult.rows) {
      const itemsResult = await pool.query(
        `
        SELECT product_id, quantity
        FROM order_items
        WHERE order_id = $1
        `,
        [row.id],
      );

      orders.push({
        id: row.id,
        cartId: row.cart_id,
        status: row.status,
        createdAt: row.created_at,
        items: itemsResult.rows.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
      });
    }

    return orders;
  }
  async findById(id: string): Promise<Order | undefined> {
    const orderResult = await pool.query(
      `
      SELECT id, cart_id, status, created_at
      FROM orders
      WHERE id = $1
      `,
      [id],
    );

    if (orderResult.rows.length === 0) {
      return undefined;
    }

    const row = orderResult.rows[0];

    const itemsResult = await pool.query(
      `
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = $1
      `,
      [row.id],
    );

    return {
      id: row.id,
      cartId: row.cart_id,
      status: row.status,
      createdAt: row.created_at,
      items: itemsResult.rows.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      })),
    };
  }
  async create(order: Order): Promise<Order> {
    const existingOrder = await this.findById(order.cartId);

    if (existingOrder) {
      console.log('Order already exists for cartId: ', order.cartId);
      return existingOrder;
    }
    try {
      await pool.query(
        `
      INSERT INTO orders (id, cart_id, status, created_at)
      VALUES ($1, $2, $3, $4)
      `,
        [order.id, order.cartId, order.status, order.createdAt],
      );
    } catch (err: any) {
      if (err.code === '23505') {
        const existingOrder = await this.findById(order.cartId);

        if (existingOrder) {
          return existingOrder;
        }
      }

      throw err;
    }

    for (const item of order.items) {
      await pool.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [order.id, item.productId, item.quantity],
      );
    }

    return order;
  }
}
