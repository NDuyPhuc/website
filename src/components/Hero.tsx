import { motion } from "motion/react";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/gym/1920/1080?blur=4')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-display font-bold text-white mb-6"
        >
          FORGE YOUR <span className="text-red-600">LEGACY</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto"
        >
          Transform your body, elevate your mind, and unlock your true potential at Ho Chi Minh City's most elite fitness destination.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button className="px-8 py-4 bg-red-600 text-white font-bold rounded-none hover:bg-red-700 transition">
            Start Your Free Trial
          </button>
          <button className="px-8 py-4 bg-transparent border border-white text-white font-bold hover:bg-white hover:text-black transition">
            View Membership Plans
          </button>
        </motion.div>
      </div>
    </section>
  );
}
