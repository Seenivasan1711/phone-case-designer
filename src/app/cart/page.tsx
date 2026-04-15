'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <ShoppingBag className="w-16 h-16 text-purple-200" />
        <h2 className="text-2xl font-bold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-400">Design a case to get started!</p>
        <Link
          href="/"
          className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
        >
          Browse Models
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-400 hover:text-red-600 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-start shadow-sm"
          >
            {/* Design preview */}
            <div className="w-20 h-36 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.designImage}
                alt="Design preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{item.phoneModel.displayName} Case</p>
              <p className="text-sm text-gray-400 mt-0.5">Custom Design</p>
              <p className="text-purple-600 font-bold mt-1">{formatPrice(item.unitPrice)} each</p>

              {/* Quantity control */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-purple-300 text-gray-500 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-purple-300 text-gray-500 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Subtotal + delete */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <p className="font-bold text-gray-800">
                {formatPrice(item.unitPrice * item.quantity)}
              </p>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Link
                href={`/design/${item.phoneModel.id}`}
                className="text-xs text-purple-500 hover:text-purple-700 transition-colors mt-1"
              >
                Re-design
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 space-y-3 border border-purple-100">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
          <span>{formatPrice(total())}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="border-t border-purple-100 pt-3 flex justify-between font-bold text-lg text-gray-900">
          <span>Total</span>
          <span className="text-purple-700">{formatPrice(total())}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-2 flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-md"
        >
          Proceed to Checkout <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
