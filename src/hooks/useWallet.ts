import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface Wallet {
  balance: number;
  userId: string;
  updatedAt: any;
}

export function useWallet(userId: string | undefined) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'wallets', userId), (docSnap) => {
      if (docSnap.exists()) {
        setWallet(docSnap.data() as Wallet);
      } else {
        setWallet({ balance: 0, userId, updatedAt: null });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { wallet, loading };
}
