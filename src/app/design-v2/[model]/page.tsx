import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { getModelById } from '@/lib/phoneModels';

const DesignEditorV2 = dynamic(() => import('@/components/DesignEditorV2'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#e8e8e8] flex items-center justify-center z-[100]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Loading editor…</p>
      </div>
    </div>
  ),
});

interface Props { params: { model: string } }

export default function DesignV2Page({ params }: Props) {
  const phoneModel = getModelById(params.model);
  if (!phoneModel) notFound();
  return <DesignEditorV2 model={phoneModel} />;
}
