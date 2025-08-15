export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';

export interface Invoice {
  id?: string;
  client: string;
  email?: string;
  amount: number;
  description: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  dueDate: string;
  status: InvoiceStatus;
  createdAt?: any;
  saleId?: string;
  userId?: string;
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  lowStockThreshold: number;
  description?: string;
  barcode?: string;
  userId?: string;
}

export interface Sale {
  id?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  discount?: number;
  tax?: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  timestamp: any;
  cashier?: string;
  userId?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
