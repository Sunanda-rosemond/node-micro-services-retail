import { pool } from '../db/pool';
import { Inventory } from '../models/inventory';

export class InventoryRepository {
  // private inventories: Inventory[] = [];

  // findByProduct(productId: string): Inventory | undefined {
  //   return this.inventories.find(
  //     (inventory) => inventory.productId === productId,
  //   );
  // }

  // save(inventory: Inventory): Inventory {
  //   const index = this.inventories.findIndex(
  //     (inv) => inv.productId === inventory.productId,
  //   );

  //   if (index === -1) {
  //     this.inventories.push(inventory);
  //   } else {
  //     this.inventories[index] = inventory;
  //   }

  //   return inventory;
  // }

  async init(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        product_id TEXT PRIMARY KEY,
        available INTEGER NOT NULL,
        reserved INTEGER NOT NULL
      );
    `);
  }
  async findByProduct(productId: string): Promise<Inventory | undefined> {
    const result = await pool.query(
      `
      SELECT product_id, available, reserved
      FROM inventory
      WHERE product_id = $1
      `,
      [productId],
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    const row = result.rows[0];

    return {
      productId: row.product_id,
      available: row.available,
      reserved: row.reserved,
    };
  }
  async save(item: Inventory): Promise<Inventory> {
    await pool.query(
      `
      INSERT INTO inventory (product_id, available, reserved)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id)
      DO UPDATE SET
        available = EXCLUDED.available,
        reserved = EXCLUDED.reserved
      `,
      [item.productId, item.available, item.reserved],
    );

    return item;
  }
}
