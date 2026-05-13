import { Router } from 'express';
import { OrderService } from '../services/order.service';

export class OrderRoutes {
  router: Router = Router();

  constructor(private orderService: OrderService) {
    this.router.get('/', async (req, res) => {
      res.json(await this.orderService.getOrders());
    });

    this.router.get('/:id', async (req, res) => {
      try {
        const order = await this.orderService.getOrder(req.params.id);
        res.json(order);
      } catch {
        res.status(404).json({ msg: 'Order not found' });
      }
    });
  }
}
