import { Router } from 'express';
import { CartService } from '../services/cart.service';

export class CartRoutes {
  router: Router = Router();

  constructor(private service: CartService) {
    this.router.post('/', async (req, res) => {
      const cart = await this.service.createCart();
      res.status(201).json(cart);
    });

    this.router.get('/', async (req, res) => {
      res.json(await this.service.getCarts());
    });

    this.router.get('/:id', async (req, res) => {
      try {
        const cart = await this.service.getCart(req.params.id);
        res.json(cart);
      } catch {
        res.status(404).json({ msg: 'Cart not found' });
      }
    });

    this.router.post('/:id/items', async (req, res) => {
      try {
        const { productId, quantity } = req.body;
        const cart = await this.service.addItem(
          req.params.id,
          productId,
          quantity,
        );
        res.status(201).json(cart);
      } catch (e) {
        // } catch (e) {
        //   res.status(400).json({ msg: 'Unable to add item' });
        // }
        console.log('ADD ITEM ERROR:', e);

        res.status(400).json({
          msg: e instanceof Error ? e.message : 'Unable to add item',
        });
      }
    });

    this.router.patch('/:id/items/:productId', async (req, res) => {
      try {
        const cart = await this.service.updateItem(
          req.params.id,
          req.params.productId,
          req.body.quantity,
        );

        res.json(cart);
      } catch {
        res.status(404).json({ msg: 'Item or cart not found' });
      }
    });

    this.router.delete('/:id/items/:productId', async (req, res) => {
      try {
        const cart = await this.service.removeItem(
          req.params.id,
          req.params.productId,
        );

        res.json(cart);
      } catch {
        res.status(404).json({ msg: 'Cart not found' });
      }
    });

    this.router.delete('/:id', async (req, res) => {
      try {
        await this.service.deleteCart(req.params.id);
        res.status(204).send();
      } catch {
        res.status(404).json({ msg: 'Cart not found' });
      }
    });
    this.router.post('/:id/checkout', async (req, res) => {
      try {
        const cart = await this.service.checkout(req.params.id);
        res.json(cart);
      } catch (e) {
        console.log('checkout error', e);
        res
          .status(400)
          .json({ msg: e instanceof Error ? e.message : 'Checkout failed' });
      }
    });
  }
}
