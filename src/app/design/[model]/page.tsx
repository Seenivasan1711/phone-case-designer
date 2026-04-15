import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getModelById } from '@/lib/phoneModels';
import { ChevronLeft } from 'lucide-react';

// Fabric.js is browser-only — never SSR the editor
const DesignEditor = dynamic(() => import('@/components/DesignEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Loading design editor…</p>
      </div>
    </div>
  ),
});

interface Props {
  params: { model: string };
}

export default function DesignPage({ params }: Props) {
  const phoneModel = getModelById(params.model);
  if (!phoneModel) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> All Models
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">{phoneModel.displayName}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Design your {phoneModel.displayName} case
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload images, add text, pick colors — then add to cart when you&apos;re happy.
        </p>
      </div>

      <DesignEditor model={phoneModel} />
    </div>
  );
}
