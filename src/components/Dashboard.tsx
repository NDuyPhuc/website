import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  Circle, 
  Clock, 
  Activity, 
  TrendingUp, 
  Save, 
  Loader2,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Wallet as WalletIcon
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useWallet } from '../hooks/useWallet';
import { 
  subscribeToUserProfile, 
  subscribeToAnnouncements, 
  syncUserProfile, 
  type UserProfile, 
  type Announcement 
} from '../lib/firestore';

export default function Dashboard() {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.uid);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states matching UserProfile
  const [displayName, setDisplayName] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [membershipPlan, setMembershipPlan] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  useEffect(() => {
    if (!user) return;

    const unsubProfile = subscribeToUserProfile(user.uid, (data) => {
      setProfile(data);
      if (data) {
        setDisplayName(data.displayName || '');
        setFitnessGoal(data.fitnessGoal || '');
        setMembershipPlan(data.membershipPlan || '');
        setPreferredTime(data.preferredTime || '');
      }
    });

    const unsubAnnouncements = subscribeToAnnouncements((data) => {
      setAnnouncements(data);
    });

    return () => {
      unsubProfile();
      unsubAnnouncements();
    };
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSyncing(true);
    setSuccessMsg(null);

    try {
      await syncUserProfile(user.uid, {
        displayName,
        fitnessGoal,
        membershipPlan,
        preferredTime,
      });
      setSuccessMsg('Profile synced reaching Titan levels!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) return null;

  return (
    <section className="py-32 bg-black min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          <div className="flex-1">
            <h1 className="text-5xl font-display font-bold text-white mb-2">ATHLETE <span className="text-red-600">DASHBOARD</span></h1>
            <p className="text-gray-500 tracking-widest text-sm uppercase">Welcome back, {user.displayName || 'Warrior'}</p>
          </div>
          <div className="flex items-center gap-4 bg-gray-900/50 p-4 border border-gray-800 rounded-lg">
             <div className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
             </div>
             <div className="h-8 w-[1px] bg-gray-800"></div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-gray-400">SYNC LIVE</span>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* PROFILE EDITOR */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gray-900 border border-gray-800 p-8 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <Activity className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-display font-bold text-white">PROFILE STRATEGY</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Your Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black border border-gray-800 p-3 text-white focus:border-red-600 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fitness Goal</label>
                  <select 
                    value={fitnessGoal}
                    onChange={(e) => setFitnessGoal(e.target.value)}
                    className="w-full bg-black border border-gray-800 p-3 text-white focus:border-red-600 outline-none transition"
                  >
                    <option>Lose weight & Build muscle</option>
                    <option>Powerlifting Strength</option>
                    <option>Athletic Performance</option>
                    <option>General Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Membership</label>
                  <select 
                    value={membershipPlan}
                    onChange={(e) => setMembershipPlan(e.target.value)}
                    className="w-full bg-black border border-gray-800 p-3 text-white focus:border-red-600 outline-none transition uppercase"
                  >
                    <option value="Essential">Essential</option>
                    <option value="Performance">Performance</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preferred Training Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      placeholder="e.g. 6AM - 8AM"
                      className="w-full bg-black border border-gray-800 py-3 pl-10 pr-4 text-white focus:border-red-600 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={isSyncing}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 transition flex items-center gap-2 group disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition" />}
                  SYNC CHANGES
                </button>
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-green-500 text-sm font-bold"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {successMsg}
                  </motion.div>
                )}
              </div>
            </form>

            <div className="mt-12 grid grid-cols-2 lg:grid-cols-5 gap-4">
               {[
                 { label: 'TITAN CREDITS', val: new Intl.NumberFormat('vi-VN').format(wallet?.balance || 0) + '₫', icon: WalletIcon },
                 { label: 'WORKOUTS', val: '12', icon: Activity },
                 { label: 'STREAK', val: '5 DAYS', icon: TrendingUp },
                 { label: 'PLAN', val: profile?.membershipPlan || 'LEVEL 1', icon: CheckCircle2 },
                 { label: 'NEXT CLASS', val: 'TOMORROW', icon: Calendar }
               ].map((item, idx) => (
                 <div key={idx} className="bg-black/40 border border-gray-800 p-4">
                    <item.icon className="w-4 h-4 text-red-600 mb-2" />
                    <p className="text-[10px] text-gray-500 font-bold tracking-tighter uppercase">{item.label}</p>
                    <p className="text-lg font-display font-bold text-white">{item.val}</p>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* REAL-TIME FEED */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="bg-gray-900 border border-gray-800 p-8 shadow-xl flex flex-col"
          >
            <div className="flex items-center gap-3 mb-8">
              <Bell className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tighter">Live Announcements</h2>
            </div>

            <div className="flex-1 space-y-6">
               {announcements.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <p className="text-sm font-bold uppercase">No live updates yet</p>
                    <p className="text-xs mt-1">Check back soon for gym alerts</p>
                 </div>
               ) : (
                 announcements.map((msg) => (
                   <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={msg.id} 
                    className={`p-4 border-l-4 ${
                      msg.type === 'warning' ? 'bg-orange-600/10 border-orange-600' : 
                      msg.type === 'success' ? 'bg-green-600/10 border-green-600' : 
                      'bg-red-600/10 border-red-600'
                    }`}
                   >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider">{msg.title}</h4>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          NOW
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{msg.message}</p>
                   </motion.div>
                 ))
               )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800">
               <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  <Circle className="w-2 h-2 text-red-600 fill-red-600 animate-pulse" />
                  Real-time synchronization active
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
