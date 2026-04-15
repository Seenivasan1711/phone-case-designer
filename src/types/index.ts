export interface PhoneModel {
  id: string;
  brand: string;
  name: string;
  displayName: string;
  price: number;
  canvasWidth: number;
  canvasHeight: number;
  frameColor: string;
  popular?: boolean;
}

export interface CartItem {
  id: string;
  phoneModel: PhoneModel;
  designImage: string;   // base64 PNG (print preview)
  designJSON: string;    // Fabric.js JSON (for re-editing)
  quantity: number;
  unitPrice: number;
}

export interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: CheckoutForm;
  total: number;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped';
}
