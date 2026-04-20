import React from 'react';
import { useAuth } from '../lib/auth';
import { useWallet } from '../hooks/useWallet';
import { User, Mail, Shield, Zap, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.uid);

  if (!user) return null;

  return (
    <section className="py-32 bg-black min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-tighter">Athlete <span className="text-red-600">Profile</span></h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Management & Statistics</p>
        </div>

        <div className="grid gap-8">
          {/* Identity Card */}
          <div className="bg-gray-900 border border-gray-800 p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center text-4xl font-display font-bold text-white">
              {user.displayName?.[0] || 'A'}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase italic">{user.displayName || 'Unnamed Warrior'}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase bg-black px-3 py-2 rounded-sm border border-gray-800">
                    <Mail className="w-3 h-3" />
                    {user.email}
                 </div>
                 <div className="flex items-center gap-2 text-xs font-bold text-green-500 uppercase bg-green-500/10 px-3 py-2 rounded-sm border border-green-500/20">
                    <Shield className="w-3 h-3" />
                    Verified Elite
                 </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 border border-gray-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-red-600" />
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">Wallet Balance</h3>
              </div>
              <p className="text-4xl font-display font-bold text-white">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(wallet?.balance || 0)}
              </p>
              <div className="mt-6 pt-6 border-t border-gray-800 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">Training Session</h3>
              </div>
              <p className="text-4xl font-display font-bold text-white">128 <span className="text-xs uppercase text-gray-500">Total Hours</span></p>
              <div className="mt-6 pt-6 border-t border-gray-800 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                <span>Member Since</span>
                <span>APR 2026</span>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-gray-900 border border-gray-800 p-8">
             <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-8">Security & Preferences</h3>
             <div className="space-y-4">
                {[
                  { label: 'Push Notifications', status: 'Enabled' },
                  { label: 'Two-Factor Auth', status: 'Disabled' },
                  { label: 'Payment Method', status: 'VietQR / PayOS' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-4 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm">{item.label}</span>
                    <button className="text-red-600 text-xs font-bold uppercase hover:underline">{item.status}</button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
