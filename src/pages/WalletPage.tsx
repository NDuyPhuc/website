import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useWallet } from '../hooks/useWallet';
import WalletCard from '../components/wallet/WalletCard';
import TopupModal from '../components/wallet/TopupModal';
import PaymentQRCode from '../components/wallet/PaymentQRCode';
import TransactionHistory from '../components/wallet/TransactionHistory';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Zap, Info } from 'lucide-react';

export default function WalletPage() {
  const { user } = useAuth();
  const { wallet, loading } = useWallet(user?.uid);
  
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [activeOrderCode, setActiveOrderCode] = useState<number | null>(null);

  if (!user) return null;

  return (
    <section className="py-32 bg-black min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-red-600 fill-red-600" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Financial Core</span>
            </div>
            <h1 className="text-6xl font-display font-bold text-white tracking-tighter">TITAN <span className="text-red-600">WALLET</span></h1>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-900/50 p-3 border border-gray-800">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            SECURE LEDGER ACTIVE
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Wallet View */}
          <div className="lg:col-span-2 space-y-12">
            
            <AnimatePresence mode="wait">
              {activeOrderCode ? (
                <motion.div 
                  key="qrcode"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <PaymentQRCode 
                    orderCode={activeOrderCode} 
                    onSuccess={() => {
                        // Let the real-time listener show success for a bit then reset
                        setTimeout(() => setActiveOrderCode(null), 3000);
                    }}
                    onCancel={() => setActiveOrderCode(null)}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="wallet-card"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                >
                  <WalletCard 
                    balance={wallet?.balance || 0} 
                    onTopupClick={() => setIsTopupModalOpen(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <TransactionHistory userId={user.uid} />
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-8">
            <div className="bg-gray-900/40 border border-gray-800 p-8">
               <h4 className="text-white font-display font-bold text-lg mb-6 flex items-center gap-2 uppercase tracking-tighter">
                  <Info className="w-5 h-5 text-red-600" />
                  Titan Credits Info
               </h4>
               <ul className="space-y-6 text-sm text-gray-400">
                  <li className="flex flex-col gap-1">
                    <span className="text-white font-bold text-xs uppercase">Instant Sync</span>
                    <p>Payments are verified via PayOS webhook and credited to your wallet in milliseconds.</p>
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="text-white font-bold text-xs uppercase">No Expiry</span>
                    <p>Your Titan credits never expire and can be used for any gym service or product.</p>
                  </li>
                  <li className="flex flex-col gap-1">
                    <span className="text-white font-bold text-xs uppercase">Secure & Private</span>
                    <p>All financial data is encrypted and handled via banking-grade security protocols.</p>
                  </li>
               </ul>
            </div>

            <div className="p-8 border border-red-600/20 bg-red-600/5 relative overflow-hidden">
               <div className="relative z-10">
                 <h4 className="text-white font-display font-bold text-lg mb-2 uppercase tracking-tighter">ELITE REFERRAL</h4>
                 <p className="text-gray-400 text-xs mb-6">Invite a friend to Titan Forge and get 100.000₫ in your wallet.</p>
                 <button className="text-red-600 text-[10px] font-bold uppercase tracking-widest hover:text-red-500 transition underline underline-offset-4">Copy Referral Link</button>
               </div>
               <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/10 blur-2xl rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <TopupModal 
        isOpen={isTopupModalOpen} 
        onClose={() => setIsTopupModalOpen(false)}
        userId={user.uid}
        onOrderCreated={(code) => {
          setIsTopupModalOpen(false);
          setActiveOrderCode(code);
        }}
      />
    </section>
  );
}
