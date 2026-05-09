import { InventoryRepository } from '../repository/inventory.repository';

export class InventoryService {
  constructor(private repo: InventoryRepository) {}

  create(productId: string, quantity: number) {
    return this.repo.save({
      productId,
      available: quantity,
      reserved: 0,
    });
  }

  get(productId: string) {
    const item = this.repo.findByProduct(productId);

    if (!item) {
      throw new Error('Inventory not found');
    }

    return item;
  }

  reserve(productId: string, quantity: number) {
    const item = this.get(productId);

    if (item.available < quantity) {
      throw new Error('Insufficient stock');
    }

    item.available -= quantity;
    item.reserved += quantity;

    return this.repo.save(item);
  }

  release(productId: string, quantity: number) {
    const item = this.get(productId);

    item.available += quantity;
    item.reserved -= quantity;

    return this.repo.save(item);
  }
  confirm(productId: string, quantity: number) {
    const item = this.get(productId);

    // 👇 TEMPORARY TEST CONDITION
    // if (productId === 'test-fail') {
    //   throw new Error('Simulated failure');
    // }

    if (item.reserved < quantity) {
      throw new Error('Not enough reserved stock');
    }

    item.reserved -= quantity;
    // available already reduced during reserve

    return this.repo.save(item);
  }
}
