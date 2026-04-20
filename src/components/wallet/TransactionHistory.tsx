import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ArrowDownLeft, ArrowUpRight, Clock, ReceiptText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Transaction {
  id: string;
  type: 'TOPUP' | 'PURCHASE';
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: any;
  orderCode?: number;
}

interface TransactionHistoryProps {
  userId: string;
}

export default function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      console.error("TX Fetch Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  if (loading) {
    return <div className="py-20 text-center animate-pulse text-gray-500 uppercase font-bold text-xs">Decrypting Ledger...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="py-20 bg-gray-900 border border-gray-800 text-center px-10">
        <ReceiptText className="w-12 h-12 text-gray-800 mx-auto mb-4" />
        <h4 className="text-xl font-display font-bold text-white mb-2 uppercase">No Activity Detected</h4>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">Your metabolic ledger is currently empty. Top up your wallet to start your journey.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 px-4 border-l-2 border-red-600">Recent Ledger Activity</h3>
      
      <div className="bg-gray-900 border border-gray-800 overflow-hidden">
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <motion.div 
              key={tx.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="group border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${tx.type === 'TOPUP' ? 'bg-green-600/10 text-green-500' : 'bg-red-600/10 text-red-600'}`}>
                    {tx.type === 'TOPUP' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-tight">
                      {tx.type === 'TOPUP' ? 'Wallet Top-up' : 'Membership Purchase'}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase mt-1">
                       <span className="flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : 'Pending'}
                       </span>
                       {tx.orderCode && <span>ID: #{tx.orderCode}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-display font-bold ${tx.type === 'TOPUP' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'TOPUP' ? '+' : '-'}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}
                  </p>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter bg-green-600/10 px-2 inline-block">
                    {tx.status}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
