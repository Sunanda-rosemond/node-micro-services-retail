import type { Product } from '../models/product.js';
import { pool } from '../db/pool';

export class ProductRepository {
  // private products: Product[] = [];

  // findAll(): Product[] {
  //   return this.products;
  // }

  // findById(id: string): Product | undefined {
  //   return this.products.find((p) => p.id === id);
  // }

  // create(product: Product): Product {
  //   this.products.push(product);
  //   return product;
  // }

  // updateStock(id: string, stock: number): Product | undefined {
  //   const product = this.findById(id);
  //   if (product) {
  //     product.stock = stock;
  //     return product;
  //   }
  // }

  // delete(id: string): boolean {
  //   const index = this.products.findIndex((p) => p.id === id);
  //   if (index === -1) return false;
  //   // remove 1 product at index where id matches
  //   this.products.splice(index, 1);
  //   return true;
  // }

  async init(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        stock INTEGER NOT NULL
      )
    `);
  }
  async findAll(): Promise<Product[]> {
    const res = await pool.query(
      'SELECT id,name,price,stock FROM products ORDER BY name ASC',
    );
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      stock: row.stock,
    }));
  }
  async findById(id: string): Promise<Product | undefined> {
    const result = await pool.query(
      `
      SELECT id, name, price, stock
      FROM products
      WHERE id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      price: Number(row.price),
      stock: row.stock,
    };
  }
  async create(product: Product): Promise<Product> {
    await pool.query(
      `
      INSERT INTO products (id, name, price, stock)
      VALUES ($1, $2, $3, $4)
      `,
      [product.id, product.name, product.price, product.stock],
    );

    return product;
  }
  async updateStock(id: string, stock: number): Promise<Product | undefined> {
    const result = await pool.query(
      `
      UPDATE products
      SET stock = $1
      WHERE id = $2
      RETURNING id, name, price, stock
      `,
      [stock, id],
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      price: Number(row.price),
      stock: row.stock,
    };
  }
  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
