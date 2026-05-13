import { v4 as uuid } from 'uuid';
import { OrderRepository } from '../repository/order.repository';
import { Order, OrderItem } from '../models/order';

export class OrderService {
  constructor(private orderRepository: OrderRepository) {}

  createOrder(cartId: string, items: OrderItem[]): Order {
    const order: Order = {
      id: uuid(),
      cartId,
      items,
      status: 'CREATED',
      createdAt: new Date(),
    };

    return this.orderRepository.create(order);
  }

  getOrders(): Order[] {
    return this.orderRepository.findAll();
  }

  getOrder(id: string): Order {
    const order = this.orderRepository.findById(id);

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }
}
