import { Cart } from '../models/cart';

export class CartRepository {
  private carts: Cart[] = [];

  findAll(): Cart[] {
    return this.carts;
  }
  findById(id: string): Cart | undefined {
    return this.carts.find((cart) => cart.id === id);
  }
  create(cart: Cart): Cart {
    this.carts.push(cart);
    return cart;
  }
  update(cart: Cart): Cart | undefined {
    const index = this.carts.findIndex((cart) => cart.id === cart.id);

    if (index === -1) {
      throw new Error('Cart not found');
    }

    this.carts[index] = cart;
    return cart;
  }
  delete(id: string): boolean {
    const index = this.carts.findIndex((cart) => cart.id === id);

    if (index === -1) {
      return false;
    }

    this.carts.splice(index, 1);
    return true;
  }
}
