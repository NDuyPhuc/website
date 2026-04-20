import React from 'react';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WalletCardProps {
  balance: number;
  onTopupClick: () => void;
  className?: string;
}

export default function WalletCard({ balance, onTopupClick, className }: WalletCardProps) {
  return (
    <div className={cn("bg-gray-900 border border-gray-800 p-8 shadow-2xl relative overflow-hidden group transition-all duration-300 hover:border-red-600/50", className)}>
      <div className="absolute -right-8 -bottom-8 opacity-[0.03] rotate-12 transition-transform duration-700 group-hover:scale-110">
        <WalletIcon size={240} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-600/10 rounded-lg">
            <WalletIcon className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Available Balance</span>
        </div>

        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-5xl font-display font-bold text-white tabular-nums">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance)}
          </span>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onTopupClick}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-sm transition flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            TOP UP WALLET
          </button>
          
          <button className="p-4 bg-gray-800 hover:bg-gray-700 text-white rounded-sm transition group">
            <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
