import axios from 'axios';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export class ProductClient {
  private baseUrl = 'http://product-service:3001';

  async getProduct(productId: string): Promise<Product> {
    const res = await axios.get<Product>(
      `${this.baseUrl}/products/${productId}`,
    );
    return res.data;
  }
  async reserveStock(productId: string, quantity: number): Promise<Product> {
    const res = await axios.patch<Product>(
      `${this.baseUrl}/products/${productId}/reserve`,
      { quantity },
    );
    return res.data;
  }
  async releaseStock(productId: string, quantity: number): Promise<Product> {
    const res = await axios.patch<Product>(
      `${this.baseUrl}/products/${productId}/release`,
      { quantity },
    );
    return res.data;
  }
}
