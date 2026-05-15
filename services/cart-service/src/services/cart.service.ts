import { v4 as uuid } from 'uuid';
import { Cart } from '../models/cart';
import { CartRepository } from '../repository/cart.repository';
import { InventoryClient } from '../clients/inventory.client';
import { EventPublisher } from '../events/publisher';

export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private inventoryClient: InventoryClient,
    private eventPublisher: EventPublisher,
  ) {}

  async createCart(): Promise<Cart> {
    const cart: Cart = {
      id: uuid(),
      items: [],
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    return await this.cartRepository.create(cart);
  }

  async getCarts(): Promise<Cart[]> {
    return await this.cartRepository.findAll();
  }
  async getCart(id: string): Promise<Cart> {
    const cart = await this.cartRepository.findById(id);

    if (!cart) {
      throw new Error('Cart not found');
    }
    //await this.releaseExpiredReservations(cart);
    return cart;
  }

  async addItem(cartId: string, productId: string, quantity: number) {
    const cart = await this.getCart(cartId);

    if (cart.status !== 'ACTIVE') {
      throw new Error('Cart is not active');
    }

    await this.eventPublisher.publishToInventory({
      type: 'RESERVE_STOCK',
      productId,
      quantity,
    });

    const existingItem = cart.items.find(
      (item) => item.productId === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.reservedAt = new Date();
      existingItem.status = 'PENDING';
    } else {
      cart.items.push({
        productId,
        quantity,
        reservedAt: new Date(),
        status: 'PENDING',
      });
    }

    return await this.cartRepository.update(cart);
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

    return await this.cartRepository.update(cart);
  }

  async removeItem(
    cartId: string,
    productId: string,
  ): Promise<Cart | undefined> {
    const cart = await this.getCart(cartId);

    cart.items = cart.items.filter((item) => item.productId !== productId);

    return this.cartRepository.update(cart);
  }

  async deleteCart(cartId: string): Promise<void> {
    const deleted = await this.cartRepository.delete(cartId);

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
    return await this.cartRepository.update(cart);
  }
  async checkout(cartId: string) {
    const cart = await this.getCart(cartId);

    if (cart.status !== 'ACTIVE') {
      throw new Error('Cart already checked out');
    }

    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const hasPendingOrFailedItems = cart.items.some(
      (item) => item.status !== 'RESERVED',
    );

    if (hasPendingOrFailedItems) {
      throw new Error('Cart contains pending or failed items');
    }

    const confirmedItems: { productId: string; quantity: number }[] = [];

    try {
      for (const item of cart.items) {
        await this.inventoryClient.confirm(item.productId, item.quantity);

        confirmedItems.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    } catch {
      for (const item of confirmedItems) {
        await this.inventoryClient.release(item.productId, item.quantity);
      }

      throw new Error('Checkout failed, rolled back reservations');
    }

    cart.status = 'CHECKED_OUT';

    const updatedCart = await this.cartRepository.update(cart);
    if (!updatedCart) {
      throw new Error('Failed to update cart');
    }

    await this.eventPublisher.publishToOrder({
      type: 'CHECKOUT_COMPLETED',
      cartId: updatedCart.id,
      items: updatedCart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    return updatedCart;
  }
  async markItemReserved(productId: string) {
    const carts = await this.cartRepository.findAll();

    for (const cart of carts) {
      const item = cart.items.find(
        (i) => i.productId === productId && i.status === 'PENDING',
      );

      if (item) {
        item.status = 'RESERVED';
        await this.cartRepository.update(cart);
      }
    }
  }
  async markItemFailed(productId: string) {
    const carts = await this.cartRepository.findAll();

    for (const cart of carts) {
      const item = cart.items.find(
        (i) => i.productId === productId && i.status === 'PENDING',
      );

      if (item) {
        item.status = 'FAILED';
        await this.cartRepository.update(cart);
      }
    }
  }
}
