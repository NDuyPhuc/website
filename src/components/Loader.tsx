import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
      <p className="text-gray-500 font-display font-medium tracking-widest text-xs uppercase animate-pulse">Syncing with Titan Forge Cloud...</p>
    </div>
  );
}
