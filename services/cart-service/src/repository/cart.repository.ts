import { Cart } from '../models/cart';
import { pool } from '../db/pool';

export class CartRepository {
  // private carts: Cart[] = [];
  // findAll(): Cart[] {
  //   return this.carts;
  // }
  // findById(id: string): Cart | undefined {
  //   return this.carts.find((cart) => cart.id === id);
  // }
  // create(cart: Cart): Cart {
  //   this.carts.push(cart);
  //   return cart;
  // }
  // update(cart: Cart): Cart | undefined {
  //   const index = this.carts.findIndex((cart) => cart.id === cart.id);
  //   if (index === -1) {
  //     throw new Error('Cart not found');
  //   }
  //   this.carts[index] = cart;
  //   return cart;
  // }
  // delete(id: string): boolean {
  //   const index = this.carts.findIndex((cart) => cart.id === id);
  //   if (index === -1) {
  //     return false;
  //   }
  //   this.carts.splice(index, 1);
  //   return true;
  // }
  async init(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reserved_at TIMESTAMP NOT NULL,
        status TEXT NOT NULL
      );
    `);
  }
  async findAll(): Promise<Cart[]> {
    const cartsResult = await pool.query(`
      SELECT id, status, created_at
      FROM carts
      ORDER BY created_at DESC
    `);

    const carts: Cart[] = [];

    for (const row of cartsResult.rows) {
      const itemsResult = await pool.query(
        `
        SELECT product_id, quantity, reserved_at, status
        FROM cart_items
        WHERE cart_id = $1
        `,
        [row.id],
      );

      carts.push({
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        items: itemsResult.rows.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          reservedAt: item.reserved_at,
          status: item.status,
        })),
      });
    }
    return carts;
  }

  async findById(id: string): Promise<Cart | undefined> {
    const cartResult = await pool.query(
      `
      SELECT id, status, created_at
      FROM carts
      WHERE id = $1
      `,
      [id],
    );

    if (cartResult.rows.length === 0) {
      return undefined;
    }

    const row = cartResult.rows[0];

    const itemsResult = await pool.query(
      `
      SELECT product_id, quantity, reserved_at, status
      FROM cart_items
      WHERE cart_id = $1
      `,
      [id],
    );

    return {
      id: row.id,
      status: row.status,
      createdAt: row.created_at,
      items: itemsResult.rows.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        reservedAt: item.reserved_at,
        status: item.status,
      })),
    };
  }
  async create(cart: Cart): Promise<Cart> {
    await pool.query(
      `
      INSERT INTO carts (id, status, created_at)
      VALUES ($1, $2, $3)
      `,
      [cart.id, cart.status, cart.createdAt],
    );

    return cart;
  }
  async update(cart: Cart): Promise<Cart> {
    await pool.query(
      `
      UPDATE carts
      SET status = $1
      WHERE id = $2
      `,
      [cart.status, cart.id],
    );

    await pool.query(
      `
      DELETE FROM cart_items
      WHERE cart_id = $1
      `,
      [cart.id],
    );

    for (const item of cart.items) {
      await pool.query(
        `
        INSERT INTO cart_items (
          cart_id,
          product_id,
          quantity,
          reserved_at,
          status
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [cart.id, item.productId, item.quantity, item.reservedAt, item.status],
      );
    }

    return cart;
  }
  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `
      DELETE FROM carts
      WHERE id = $1
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
