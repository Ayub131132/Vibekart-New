export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  stock: number;
};

export type CartItem = Product & {
  quantity: number;
};

export type OrderStatus = 
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out for delivery'
  | 'delivered'
  | 'cancelled';

export type Order = {
  orderId: string;
  uid: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  address: string;
  paymentMethod: string;
};

// Dummy export to ensure module resolution
export const TYPE_SYSTEM_VERSION = '1.0.0';
