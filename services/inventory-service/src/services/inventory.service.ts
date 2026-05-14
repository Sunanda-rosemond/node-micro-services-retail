import { InventoryRepository } from '../repository/inventory.repository';

export class InventoryService {
  constructor(private repo: InventoryRepository) {}

  async create(productId: string, quantity: number) {
    return await this.repo.save({
      productId,
      available: quantity,
      reserved: 0,
    });
  }

  async get(productId: string) {
    const item = await this.repo.findByProduct(productId);

    if (!item) {
      throw new Error('Inventory not found');
    }

    return item;
  }

  async reserve(productId: string, quantity: number) {
    const item = await this.get(productId);

    if (item.available < quantity) {
      throw new Error('Insufficient stock');
    }

    item.available -= quantity;
    item.reserved += quantity;

    return this.repo.save(item);
  }

  async release(productId: string, quantity: number) {
    const item = await this.get(productId);

    item.available += quantity;
    item.reserved -= quantity;

    return this.repo.save(item);
  }
  async confirm(productId: string, quantity: number) {
    const item = await this.get(productId);

    // 👇 TEMPORARY TEST CONDITION
    // if (productId === 'test-fail') {
    //   throw new Error('Simulated failure');
    // }

    if (item.reserved < quantity) {
      throw new Error('Not enough reserved stock');
    }

    item.reserved -= quantity;
    // available already reduced during reserve

    return await this.repo.save(item);
  }
}
