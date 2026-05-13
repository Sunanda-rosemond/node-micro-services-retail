import { Order } from '../models/order';

export class OrderRepository {
  private orders: Order[] = [];

  findAll(): Order[] {
    return this.orders;
  }

  findById(id: string): Order | undefined {
    return this.orders.find((order) => order.id === id);
  }

  create(order: Order): Order {
    this.orders.push(order);
    return order;
  }
}
