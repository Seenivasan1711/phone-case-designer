'use client';

import Link from 'next/link';
import { ShoppingCart, Smartphone } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function Navbar() {
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-purple-700">
          <Smartphone className="w-6 h-6" />
          CaseCanvas
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-purple-600 transition-colors">Models</Link>
          <Link href="/cart" className="hover:text-purple-600 transition-colors">My Designs</Link>
        </nav>

        <Link
          href="/cart"
          className="relative flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Cart
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
