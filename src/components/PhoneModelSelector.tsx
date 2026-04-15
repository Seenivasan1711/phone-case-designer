'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneModel } from '@/types';
import { PHONE_MODELS, BRANDS } from '@/lib/phoneModels';
import { formatPrice } from '@/lib/utils';
import { Smartphone, Star } from 'lucide-react';

const brandColors: Record<string, string> = {
  Apple: 'bg-gray-100 text-gray-700',
  Samsung: 'bg-blue-100 text-blue-700',
  Google: 'bg-green-100 text-green-700',
  OnePlus: 'bg-red-100 text-red-700',
  Nothing: 'bg-zinc-900 text-white',
};

export default function PhoneModelSelector() {
  const router = useRouter();
  const [activeBrand, setActiveBrand] = useState('All');

  const filtered =
    activeBrand === 'All'
      ? PHONE_MODELS
      : PHONE_MODELS.filter((m) => m.brand === activeBrand);

  const handleSelect = (model: PhoneModel) => {
    router.push(`/design-v2/${model.id}`);
  };

  return (
    <div>
      {/* Brand filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {BRANDS.map((brand) => (
          <button
            key={brand}
            onClick={() => setActiveBrand(brand)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeBrand === brand
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Model grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((model) => (
            <button key={model.id} onClick={() => handleSelect(model)}
            className="group relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all text-left">
            {model.popular && (
              <span className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                Popular
              </span>
            )}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-28 rounded-[14px] border-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                style={{ borderColor: model.frameColor, backgroundColor: model.frameColor + '22' }}>
                <Smartphone className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1 ${brandColors[model.brand] ?? 'bg-gray-100 text-gray-600'}`}>
              {model.brand}
            </span>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{model.name}</p>
            <p className="text-purple-600 font-bold text-sm mt-1">{formatPrice(model.price)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
