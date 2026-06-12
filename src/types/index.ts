export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

export interface CartItem extends MenuItem {
  qty: number;
  notes: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_notes: string;
  items: CartItem[];
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}
