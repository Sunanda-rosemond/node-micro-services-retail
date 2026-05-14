import { v4 as uuidv4 } from 'uuid';
import type { Product } from '../models/product.js';
import { ProductRepository } from '../repository/product.repository.js';

export class ProductService {
  constructor(private repo: ProductRepository) {}

  async getProducts(): Promise<Product[]> {
    return await this.repo.findAll();
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const product = await this.repo.findById(id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async createProduct(
    name: string,
    price: number,
    stock: number,
  ): Promise<Product> {
    const product: Product = {
      id: uuidv4(),
      name,
      price,
      stock,
    };
    await this.repo.create(product);
    return product;
  }
  async updateStock(id: string, stock: number): Promise<Product> {
    const product = await this.repo.updateStock(id, stock);
    if (!product) throw new Error('Product not found');
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error('Product not found');
  }

  async reserveStock(id: string, quantity: number): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.stock < quantity) {
      throw new Error('Not enough stock');
    }
    product.stock -= quantity;
    return product;
  }
  async releaseStock(id: string, quantity: number): Promise<Product> {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    product.stock += quantity;
    return product;
  }
}
