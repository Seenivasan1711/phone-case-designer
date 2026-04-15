'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, generateOrderId } from '@/lib/utils';
import { CheckoutForm } from '@/types';
import { CreditCard, MapPin, CheckCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid Indian mobile number required'),
  address: z.string().min(10, 'Full address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  pincode: z.string().regex(/^\d{6}$/, '6-digit pincode required'),
});

type FormData = z.infer<typeof schema>;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [orderId, setOrderId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Redirect on client if cart is empty (can't call router during SSR render)
  if (typeof window !== 'undefined' && items.length === 0 && step !== 'success') {
    router.replace('/');
    return null;
  }

  const onSubmit = async (data: FormData) => {
    setStep('processing');

    // Simulate payment processing (replace with Razorpay in production)
    await new Promise((r) => setTimeout(r, 2000));

    const id = generateOrderId();
    // POST order to API
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, items, customer: data, total: total(), status: 'confirmed' }),
    });

    setOrderId(id);
    clearCart();
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Order Placed!</h1>
        <p className="text-gray-500">
          Your custom case is being prepared. You&apos;ll receive a confirmation email shortly.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
          <p>Order ID</p>
          <p className="font-mono font-bold text-purple-700 text-lg">{orderId}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          Design Another Case
        </button>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-gray-600 font-medium">Processing your order…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" /> Delivery Address
            </h2>

            {[
              { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Rajesh Kumar' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'rajesh@example.com' },
              { name: 'phone', label: 'Mobile Number', type: 'tel', placeholder: '9876543210' },
              { name: 'address', label: 'Address', type: 'text', placeholder: 'Flat 4B, Green Apartments, MG Road' },
              { name: 'city', label: 'City', type: 'text', placeholder: 'Bengaluru' },
              { name: 'pincode', label: 'Pincode', type: 'text', placeholder: '560001' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  {...register(name as keyof FormData)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                {errors[name as keyof FormData] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[name as keyof FormData]?.message}
                  </p>
                )}
              </div>
            ))}

            {/* State dropdown */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">State</label>
              <select
                {...register('state')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
            </div>
          </div>

          {/* Payment (mock) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" /> Payment
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
              <strong>POC Mode:</strong> Razorpay integration ready. Click below to simulate payment.
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-semibold text-base transition-colors shadow-lg"
          >
            Pay {formatPrice(total())} — Place Order
          </button>
        </form>

        {/* Order summary */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-800">Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.designImage}
                alt=""
                className="w-12 h-20 object-cover rounded-lg border border-gray-200"
              />
              <div>
                <p className="font-medium text-gray-700">{item.phoneModel.displayName}</p>
                <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                <p className="text-purple-600 font-bold mt-1">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          ))}
          <div className="bg-purple-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span><span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 mt-1 pt-2 border-t border-purple-100">
              <span>Total</span><span className="text-purple-700">{formatPrice(total())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
