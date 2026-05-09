import { Inventory } from '../models/inventory';
export class InventoryRepository {
  private inventories: Inventory[] = [];

  findByProduct(productId: string): Inventory | undefined {
    return this.inventories.find(
      (inventory) => inventory.productId === productId,
    );
  }

  save(inventory: Inventory): Inventory {
    const index = this.inventories.findIndex(
      (inv) => inv.productId === inventory.productId,
    );

    if (index === -1) {
      this.inventories.push(inventory);
    } else {
      this.inventories[index] = inventory;
    }

    return inventory;
  }
}
