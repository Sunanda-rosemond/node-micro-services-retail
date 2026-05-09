import { v4 as uuidv4 } from 'uuid';
import type { Product } from '../models/product.js';
import { ProductRepository } from '../repository/product.repository.js';

export class ProductService {
  constructor(private repo: ProductRepository) {}

  getProducts(): Product[] {
    return this.repo.findAll();
  }

  getProduct(id: string): Product | undefined {
    const product = this.repo.findById(id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  createProduct(name: string, price: number, stock: number): Product {
    const product: Product = {
      id: uuidv4(),
      name,
      price,
      stock,
    };
    this.repo.create(product);
    return product;
  }
  updateStock(id: string, stock: number): Product {
    const product = this.repo.updateStock(id, stock);
    if (!product) throw new Error('Product not found');
    return product;
  }

  deleteProduct(id: string): void {
    const deleted = this.repo.delete(id);
    if (!deleted) throw new Error('Product not found');
  }
  reserveStock(id: string, quantity: number) {
    const product = this.getProduct(id);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.stock < quantity) {
      throw new Error('Not enough stock');
    }
    product.stock -= quantity;
    return product;
  }
  releaseStock(id: string, quantity: number) {
    const product = this.repo.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    product.stock += quantity;
    return product;
  }
}
