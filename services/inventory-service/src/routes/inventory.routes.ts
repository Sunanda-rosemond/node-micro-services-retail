import { Router } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryRoutes {
  router: Router = Router();

  constructor(private service: InventoryService) {
    this.router.post('/', (req, res) => {
      const { productId, quantity } = req.body;
      res.status(201).json(this.service.create(productId, quantity));
    });

    this.router.get('/:productId', (req, res) => {
      try {
        res.json(this.service.get(req.params.productId));
      } catch {
        res.status(404).json({ msg: 'Not found' });
      }
    });

    this.router.patch('/:productId/reserve', (req, res) => {
      try {
        const { quantity } = req.body;
        res.json(this.service.reserve(req.params.productId, quantity));
      } catch (e) {
        res.status(400).json({ msg: 'Insufficient stock' });
      }
    });

    this.router.patch('/:productId/release', (req, res) => {
      const { quantity } = req.body;
      res.json(this.service.release(req.params.productId, quantity));
    });
    this.router.patch('/:productId/confirm', (req, res) => {
      try {
        const { quantity } = req.body;
        res.json(this.service.confirm(req.params.productId, quantity));
      } catch {
        res.status(400).json({ msg: 'Unable to confirm stock' });
      }
    });
  }
}
