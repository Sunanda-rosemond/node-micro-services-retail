import { Router } from 'express';
import { ProductService } from '../services/product.service';

export class ProductRoutes {
  router: Router = Router();
  constructor(private service: ProductService) {
    this.router.get('/', (req, res) => {
      res.json(this.service.getProducts());
    });
    this.router.get('/:id', (req, res) => {
      try {
        const product = this.service.getProduct(req.params.id);
        res.json(product);
      } catch (e) {
        res.status(404).json({ msg: 'Product not found' });
      }
    });
    this.router.post('/', (req, res) => {
      const { name, price, stock } = req.body;
      if (!name || price === undefined || stock === null) {
        return res.status(400).json({ msg: 'Invalid input' });
      }
      const product = this.service.createProduct(name, price, stock);
      res.status(201).json(product);
    });

    this.router.patch('/:id', (req, res) => {
      try {
        const product = this.service.updateStock(req.params.id, req.body.stock);
        res.json(product);
      } catch (e) {
        res.status(404).json({ msg: 'Product not found' });
      }
    });

    this.router.delete('/:id', (req, res) => {
      try {
        this.service.deleteProduct(req.params.id);
        res.status(204).send();
      } catch (e) {
        res.status(404).json({ msg: 'Product not found' });
      }
    });

    this.router.patch('/:id/reserve', (req, res) => {
      try {
        const product = this.service.reserveStock(
          req.params.id,
          req.body.quantity,
        );
        res.json(product);
      } catch (e) {
        res.status(400).json({ msg: (e as Error).message });
      }
    });
    this.router.patch('/:id/release', (req, res) => {
      try {
        const product = this.service.releaseStock(
          req.params.id,
          req.body.quantity,
        );
        res.json(product);
      } catch (e) {
        res.status(400).json({ msg: (e as Error).message });
      }
    });
  }
}
