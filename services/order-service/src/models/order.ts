export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  cartId: string;
  items: OrderItem[];
  status: 'CREATED';
  createdAt: Date;
}
