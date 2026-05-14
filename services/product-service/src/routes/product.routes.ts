import { Router } from 'express';
import { ProductService } from '../services/product.service';

export class ProductRoutes {
  router: Router = Router();
  constructor(private service: ProductService) {
    this.router.get('/', async (req, res) => {
      res.json(await this.service.getProducts());
    });
    this.router.get('/:id', async (req, res) => {
      try {
        const product = await this.service.getProduct(req.params.id);
        res.json(product);
      } catch (e) {
        res.status(404).json({ msg: 'Product not found' });
      }
    });
    this.router.post('/', async (req, res) => {
      try {
        const { name, price, stock } = req.body;

        const product = await this.service.createProduct(name, price, stock);

        res.status(201).json(product);
      } catch (e) {
        console.log('CREATE PRODUCT ERROR:', e);

        res.status(500).json({
          msg: e instanceof Error ? e.message : 'Unable to create product',
        });
      }
    });

    this.router.patch('/:id', async (req, res) => {
      try {
        const product = await this.service.updateStock(
          req.params.id,
          req.body.stock,
        );
        res.json(product);
      } catch (e) {
        res.status(404).json({ msg: 'Product not found' });
      }
    });

    this.router.delete('/:id', async (req, res) => {
      try {
        await this.service.deleteProduct(req.params.id);
        res.status(204).send();
      } catch (e) {
        res.status(404).json({ msg: 'Product not found' });
      }
    });

    this.router.patch('/:id/reserve', async (req, res) => {
      try {
        const product = await this.service.reserveStock(
          req.params.id,
          req.body.quantity,
        );
        res.json(product);
      } catch (e) {
        res.status(400).json({ msg: (e as Error).message });
      }
    });
    this.router.patch('/:id/release', async (req, res) => {
      try {
        const product = await this.service.releaseStock(
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
