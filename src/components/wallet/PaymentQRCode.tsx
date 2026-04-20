import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { usePaymentOrder } from '../../hooks/usePaymentOrder';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentQRCodeProps {
  orderCode: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentQRCode({ orderCode, onSuccess, onCancel }: PaymentQRCodeProps) {
  const { order, loading } = usePaymentOrder(orderCode);

  useEffect(() => {
    if (order?.status === 'PAID') {
      const timer = setTimeout(onSuccess, 2000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, onSuccess]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-900 border border-gray-800">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Connecting to PayOS Bank Gateway...</p>
      </div>
    );
  }

  if (!order) return null;

  if (order.status === 'PAID') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 bg-gray-900 border border-green-600/50 text-center px-10"
      >
        <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-3xl font-display font-bold text-white mb-2">PAYMENT SUCCESSFUL!</h3>
        <p className="text-gray-400 mb-8 max-w-xs">Your credits have been added to your Titan Forge wallet automatically.</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/10 border border-green-600 text-green-500 text-xs font-bold rounded-full uppercase tracking-tighter">
          Instant Sync Active
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 overflow-hidden flex flex-col md:flex-row">
      {/* QR Side */}
      <div className="p-10 flex flex-col items-center justify-center bg-white">
        <h4 className="text-black font-display font-bold text-xl mb-6 text-center">Scan with Bank App</h4>
        <div className="p-4 bg-white border-4 border-black">
          {order.qrCode ? (
            <QRCodeSVG value={order.qrCode} size={220} level="M" includeMargin={false} />
          ) : (
             <div className="w-[220px] h-[220px] bg-gray-100 animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
             </div>
          )}
        </div>
        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
           <img src="https://picsum.photos/seed/napthe/40/20" alt="VietQR" className="h-4" referrerPolicy="no-referrer" />
           <span className="text-[10px] font-bold text-gray-500 uppercase">VietQR Standard</span>
        </div>
      </div>

      {/* Info Side */}
      <div className="p-10 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Verified Payment Link</span>
          </div>

          <h3 className="text-2xl font-display font-bold text-white mb-4">ORDER #{order.orderCode}</h3>
          
          <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center text-sm py-3 border-b border-gray-800">
              <span className="text-gray-500 uppercase font-bold tracking-tighter">Total Amount</span>
              <span className="text-white font-bold text-xl">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-3 border-b border-gray-800">
              <span className="text-gray-500 uppercase font-bold tracking-tighter">Status</span>
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span className="font-bold uppercase tracking-tighter">Waiting for Payment</span>
              </div>
            </div>
          </div>

          <a 
            href={order.checkoutUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 transition flex items-center justify-center gap-2 group mb-4"
          >
            OPEN IN CHECKOUT PAGE
            <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>

          <button 
            onClick={onCancel}
            className="w-full text-gray-500 hover:text-white font-bold py-2 text-xs uppercase tracking-widest transition"
          >
            Cancel and Return
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
          </div>
          <p className="text-[10px] text-gray-500 font-medium leading-tight uppercase">
            Listening for transaction... <br />
            Do not close this page after payment.
          </p>
        </div>
      </div>
    </div>
  );
}
