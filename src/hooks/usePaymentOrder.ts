import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface PaymentOrder {
  orderCode: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  amount: number;
  qrCode?: string;
  checkoutUrl?: string;
  paidAt?: any;
}

export function usePaymentOrder(orderCode: number | null) {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'paymentOrders', String(orderCode)), (docSnap) => {
      if (docSnap.exists()) {
        setOrder(docSnap.data() as PaymentOrder);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [orderCode]);

  return { order, loading };
}
