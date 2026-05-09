import axios from 'axios';

export class InventoryClient {
  private baseUrl = 'http://inventory-service:3003';

  async reserve(productId: string, quantity: number) {
    const res = await axios.patch(
      `${this.baseUrl}/inventory/${productId}/reserve`,
      { quantity },
    );
    return res.data;
  }

  async release(productId: string, quantity: number) {
    await axios.patch(`${this.baseUrl}/inventory/${productId}/release`, {
      quantity,
    });
  }
  async confirm(productId: string, quantity: number) {
    const res = await axios.patch(
      `${this.baseUrl}/inventory/${productId}/confirm`,
      { quantity },
    );
    return res.data;
  }
}
