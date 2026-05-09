import { v4 as uuid } from 'uuid';
import { Cart } from '../models/cart';
import { CartRepository } from '../repository/cart.repository';
import { ProductClient } from '../clients/product.client';
import { InventoryClient } from '../clients/inventory.client';
import { EventPublisher } from '../events/publisher';

export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private productClient: ProductClient,
    private inventoryClient: InventoryClient,
    private eventPublisher: EventPublisher,
  ) {}

  createCart(): Cart {
    const cart: Cart = {
      id: uuid(),
      items: [],
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    return this.cartRepository.create(cart);
  }

  getCarts(): Cart[] {
    return this.cartRepository.findAll();
  }
  async getCart(id: string): Promise<Cart> {
    const cart = this.cartRepository.findById(id);

    if (!cart) {
      throw new Error('Cart not found');
    }
    await this.releaseExpiredReservations(cart);
    return cart;
  }

  async addItem(cartId: string, productId: string, quantity: number) {
    const cart = await this.getCart(cartId);

    if (cart.status !== 'ACTIVE') {
      throw new Error('Cart is not active');
    }

    //const product = await this.inventoryClient.reserve(productId, quantity);
    const product = await this.eventPublisher.publish({
      type: 'RESERVE_STOCK',
      productId,
      quantity,
    });

    // if (product.stock < quantity) {
    //   throw new Error('Not enough stock');
    // }

    const existingItem = cart.items.find(
      (item) => item.productId === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.reservedAt = new Date();
    } else {
      cart.items.push({
        productId,
        quantity,
        reservedAt: new Date(),
        status: 'PENDING',
      });
    }

    return this.cartRepository.update(cart);
  }

  async updateItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart | undefined> {
    const cart = await this.getCart(cartId);

    const item = cart.items.find((item) => item.productId === productId);

    if (!item) {
      throw new Error('Item not found');
    }

    item.quantity = quantity;

    return this.cartRepository.update(cart);
  }

  async removeItem(
    cartId: string,
    productId: string,
  ): Promise<Cart | undefined> {
    const cart = await this.getCart(cartId);

    cart.items = cart.items.filter((item) => item.productId !== productId);

    return this.cartRepository.update(cart);
  }

  deleteCart(cartId: string): void {
    const deleted = this.cartRepository.delete(cartId);

    if (!deleted) {
      throw new Error('Cart not found');
    }
  }
  private isExpired(date: Date): boolean {
    const two_minutes = 2 * 60 * 1000;
    return Date.now() - new Date(date).getTime() > two_minutes;
  }

  async releaseExpiredReservations(cart: Cart): Promise<Cart | undefined> {
    for (const item of cart.items) {
      if (item.reservedAt && this.isExpired(item.reservedAt)) {
        await this.inventoryClient.release(item.productId, item.quantity);
      }
    }
    cart.items = cart.items.filter(
      (item) => !item.reservedAt || !this.isExpired(item.reservedAt),
    );
    return this.cartRepository.update(cart);
  }
  async checkout(cartId: string) {
    const cart = await this.getCart(cartId);

    if (cart.status !== 'ACTIVE') {
      throw new Error('Cart already checked out');
    }

    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const confirmedItems: { productId: string; quantity: number }[] = [];
    try {
      for (const item of cart.items) {
        await this.inventoryClient.confirm(item.productId, item.quantity);

        // track successful steps
        confirmedItems.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      cart.status = 'CHECKED_OUT';

      return this.cartRepository.update(cart);
    } catch (e) {
      for (const item of confirmedItems) {
        await this.inventoryClient.release(item.productId, item.quantity);
      }
      throw new Error('Checkout failed, roleed back reservations');
    }
  }
  async markItemReserved(productId: string) {
    const carts = this.cartRepository.findAll();

    for (const cart of carts) {
      const item = cart.items.find(
        (i) => i.productId === productId && i.status === 'PENDING',
      );

      if (item) {
        item.status = 'RESERVED';
        this.cartRepository.update(cart);
      }
    }
  }
  async markItemFailed(productId: string) {
    const carts = this.cartRepository.findAll();

    for (const cart of carts) {
      const item = cart.items.find(
        (i) => i.productId === productId && i.status === 'PENDING',
      );

      if (item) {
        item.status = 'FAILED';
        this.cartRepository.update(cart);
      }
    }
  }
}
