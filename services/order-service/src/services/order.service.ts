import { v4 as uuid } from 'uuid';
import { OrderRepository } from '../repository/order.repository';
import { Order, OrderItem } from '../models/order';

export class OrderService {
  constructor(private orderRepository: OrderRepository) {}

  async createOrder(cartId: string, items: OrderItem[]): Promise<Order> {
    const order: Order = {
      id: uuid(),
      cartId,
      items,
      status: 'CREATED',
      createdAt: new Date(),
    };

    return await this.orderRepository.create(order);
  }

  async getOrders(): Promise<Order[]> {
    return await this.orderRepository.findAll();
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }
}
