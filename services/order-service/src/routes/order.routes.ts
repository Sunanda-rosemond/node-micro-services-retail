import { Router } from 'express';
import { OrderService } from '../services/order.service';

export class OrderRoutes {
  router: Router = Router();

  constructor(private orderService: OrderService) {
    this.router.get('/', (req, res) => {
      res.json(this.orderService.getOrders());
    });

    this.router.get('/:id', (req, res) => {
      try {
        const order = this.orderService.getOrder(req.params.id);
        res.json(order);
      } catch {
        res.status(404).json({ msg: 'Order not found' });
      }
    });
  }
}
