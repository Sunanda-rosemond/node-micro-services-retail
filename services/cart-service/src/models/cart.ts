export interface CartItem {
  productId: string;
  quantity: number;
  reservedAt: Date;
  status: 'PENDING' | 'RESERVED' | 'FAILED';
}

export interface Cart {
  id: string;
  items: CartItem[];
  status: 'ACTIVE' | 'CHECKED_OUT';
  createdAt: Date;
}
