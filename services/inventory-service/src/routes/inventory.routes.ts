import { Router } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryRoutes {
  router: Router = Router();

  constructor(private service: InventoryService) {
    this.router.post('/', async (req, res) => {
      const { productId, quantity } = req.body;
      res.status(201).json(await this.service.create(productId, quantity));
    });

    this.router.get('/:productId', async (req, res) => {
      try {
        res.json(await this.service.get(req.params.productId));
      } catch {
        res.status(404).json({ msg: 'Not found' });
      }
    });

    this.router.patch('/:productId/reserve', async (req, res) => {
      try {
        const { quantity } = req.body;
        res.json(await this.service.reserve(req.params.productId, quantity));
      } catch (e) {
        res.status(400).json({ msg: 'Insufficient stock' });
      }
    });

    this.router.patch('/:productId/release', async (req, res) => {
      const { quantity } = req.body;
      res.json(await this.service.release(req.params.productId, quantity));
    });

    this.router.patch('/:productId/confirm', async (req, res) => {
      try {
        const { quantity } = req.body;
        res.json(await this.service.confirm(req.params.productId, quantity));
      } catch {
        res.status(400).json({ msg: 'Unable to confirm stock' });
      }
    });
  }
}
