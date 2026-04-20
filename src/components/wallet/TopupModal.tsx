import React, { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { createTopupOrder } from '../../lib/payments';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onOrderCreated: (orderCode: number) => void;
}

const AMOUNTS = [
  { value: 10000, label: '10.000₫' },
  { value: 50000, label: '50.000₫' },
  { value: 100000, label: '100.000₫' },
  { value: 200000, label: '200.000₫' },
  { value: 500000, label: '500.000₫' },
];

export default function TopupModal({ isOpen, onClose, userId, onOrderCreated }: TopupModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTopup = async () => {
    if (!selectedAmount) return;
    setLoading(true);
    setError(null);

    try {
      const res = await createTopupOrder(userId, selectedAmount, `Titan Forge Topup for ${userId}`);
      onOrderCreated(res.orderCode);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-gray-900 border border-gray-800 p-10 shadow-2xl overflow-hidden">
        {/* Accent decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/5 blur-3xl translate-y-1/2 -translate-x-1/2 rounded-full"></div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-6 h-6 text-red-600" />
            <h2 className="text-3xl font-display font-bold text-white tracking-tighter">BOOST YOUR CREDIT</h2>
          </div>

          <p className="text-gray-400 mb-10 leading-relaxed max-w-md">
            Select an amount to recharge your Titan Forge wallet. Credits are added automatically after successful payment.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {AMOUNTS.map((amt) => (
              <button 
                key={amt.value}
                onClick={() => setSelectedAmount(amt.value)}
                className={`py-4 px-6 border font-display font-bold text-lg transition-all duration-300 ${
                  selectedAmount === amt.value 
                  ? 'border-red-600 bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] scale-[1.02]' 
                  : 'border-gray-800 bg-black text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                {amt.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-600/10 border border-red-600 text-red-600 text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          <button 
            disabled={!selectedAmount || loading}
            onClick={handleTopup}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-5 tracking-widest transition flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'GENERATE VIETQR CODE'}
          </button>
          
          <p className="mt-6 text-center text-xs text-gray-600 uppercase tracking-widest font-bold">
            Powered by payOS Security
          </p>
        </div>
      </div>
    </div>
  );
}
