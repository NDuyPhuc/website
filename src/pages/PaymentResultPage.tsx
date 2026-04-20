import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const orderCode = searchParams.get('orderCode');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [webhookVerified, setWebhookVerified] = useState(false);

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const docRef = doc(db, 'paymentOrders', orderCode);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrderData(data);
          setWebhookVerified(data.webhookVerified);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // If payment was successful, poll for webhook verification every 2 seconds
    if (status === 'success' && orderCode) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/order-status/${orderCode}`);
          if (!response.ok) throw new Error('Failed to fetch order status');
          
          const data = await response.json();
          if (data.order) {
            setOrderData(data.order);
            if (data.order.webhookVerified) {
              console.log('✅ Webhook verified! Payment processed.');
              setWebhookVerified(true);
              clearInterval(pollInterval); // Stop polling once verified
            }
          }
        } catch (err) {
          console.warn("Error polling order status:", err);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(pollInterval); // Cleanup interval
    }
  }, [orderCode, status]);

  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  return (
    <section className="py-32 bg-black min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-900 border border-gray-800 p-10 text-center"
      >
        {isSuccess ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 uppercase italic tracking-tighter">Payment <span className="text-green-500">Successful</span></h1>
            <p className="text-gray-400 text-sm mb-8">
              {webhookVerified 
                ? "Titan Credits have been forged and added to your wallet. ✓" 
                : "Processing payment verification... Crediting wallet shortly."}
            </p>
            {!webhookVerified && (
              <div className="mb-6 text-xs text-gray-500 flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                Waiting for payment confirmation...
              </div>
            )}
          </div>
        ) : isCancelled ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 uppercase italic tracking-tighter">Payment <span className="text-red-500">Cancelled</span></h1>
            <p className="text-gray-400 text-sm mb-8">The forging process was interrupted. No credits were added.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 border border-yellow-500/20">
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 uppercase italic tracking-tighter">Status <span className="text-yellow-500">Unknown</span></h1>
            <p className="text-gray-400 text-sm mb-8">We couldn't verify the state of this transaction.</p>
          </div>
        )}

        {orderData && (
          <div className="bg-black/50 p-6 rounded-sm border border-gray-800 text-left mb-8">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              <span>Order ID</span>
              <span className="text-white">#{orderCode}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span>Amount</span>
              <span className="text-white">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderData.amount)}</span>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          <Link 
            to="/wallet" 
            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Go to Wallet
          </Link>
          <Link 
            to="/" 
            className="w-full py-4 bg-gray-800 text-white font-bold uppercase tracking-widest text-xs hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
