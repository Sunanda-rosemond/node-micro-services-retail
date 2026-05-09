import type { Product } from '../models/product.js';

export class ProductRepository {
  private products: Product[] = [];

  findAll(): Product[] {
    return this.products;
  }

  findById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  create(product: Product): Product {
    this.products.push(product);
    return product;
  }

  updateStock(id: string, stock: number): Product | undefined {
    const product = this.findById(id);
    if (product) {
      product.stock = stock;
      return product;
    }
  }

  delete(id: string): boolean {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    // remove 1 product at index where id matches
    this.products.splice(index, 1);
    return true;
  }
}
