import PhoneModelSelector from '@/components/PhoneModelSelector';
import { Sparkles, Truck, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12 bg-gradient-to-b from-purple-50 to-transparent rounded-3xl">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <Sparkles className="w-4 h-4" />
          Design your perfect case
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Custom Phone Cases,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
            Built by You
          </span>
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto text-lg">
          Upload your photos, add text, choose colors — then order a premium print-quality case delivered to your door.
        </p>
      </section>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-center text-sm text-gray-600">
        {[
          { icon: ShieldCheck, label: 'Premium quality print' },
          { icon: Truck, label: 'Ships in 3–5 days' },
          { icon: Sparkles, label: 'Unlimited designs' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <Icon className="w-5 h-5 text-purple-500" />
            {label}
          </div>
        ))}
      </div>

      {/* Model selector */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Phone Model</h2>
        <p className="text-gray-500 mb-6">Select your device to get a perfectly-fitted case template.</p>
        <PhoneModelSelector />
      </section>
    </div>
  );
}
