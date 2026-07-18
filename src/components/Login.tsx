import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Eye, EyeOff, X, ArrowRight, KeyRound } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, pass: string) => boolean;
  logoUrl?: string;
}

export default function Login({ isOpen, onClose, onLogin, logoUrl }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShake, setIsShake] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setErrorMsg('');
      setIsShake(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(username, password);
    if (!success) {
      setErrorMsg('Username atau password tidak valid!');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
    } else {
      setErrorMsg('');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 overflow-hidden"
        >
          {/* Background Mesh Orbs exactly like Portal */}
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px] pointer-events-none"></div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`w-full max-w-[420px] bg-white rounded-[32px] p-8 shadow-2xl border border-emerald-100 space-y-6 relative z-10 mx-4 ${isShake ? 'animate-shake' : ''}`}
          >
            {/* Header / Brand Identity synchronized with Portal Banner */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="relative inline-block mb-6">
                <motion.div 
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                  className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/10 border border-emerald-50 overflow-hidden p-2 mx-auto"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl bg-white" />
                  ) : (
                    <Shield className="w-10 h-10 text-emerald-800" />
                  )}
                </motion.div>
              </div>
              
              <h2 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase leading-none">
                <span className="text-gray-900">E</span><span className="text-emerald-500 font-black">-</span><span className="text-gray-900">SANGU</span> <span className="text-emerald-500">SANTRI</span>
              </h2>
              <div className="h-1 w-10 bg-yellow-400 mx-auto mt-3 rounded-full"></div>
              <p className="text-[10px] text-emerald-850 font-extrabold uppercase tracking-widest mt-4">
                PORTAL ADMINISTRATOR / BENDAHARA
              </p>
            </motion.div>

            {/* Form using Portal style inputs & fields */}
            <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center justify-center text-center"
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest ml-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 bg-white/80 border-2 border-emerald-100 rounded-2xl text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-900/35"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-black text-emerald-950 text-[10px] uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 pr-14 bg-white/80 border-2 border-emerald-100 rounded-2xl text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-emerald-900/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-emerald-800/40 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-2xl text-xs shadow-xl hover:shadow-emerald-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-6 uppercase tracking-widest border-none"
              >
                <KeyRound className="w-4 h-4 text-yellow-400" />
                Login
              </button>
            </motion.form>

            {/* Back to Portal / Close modal action styled beautifully */}
            <motion.div variants={itemVariants} className="pt-2 text-center border-t border-emerald-950/10 flex flex-col items-center gap-2">
              <button
                onClick={onClose}
                className="group inline-flex items-center gap-2 px-5 py-2 rounded-full hover:bg-emerald-50 transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <X className="w-3 h-3 text-emerald-800 group-hover:text-red-600" />
                </div>
                <span className="text-[9px] font-black text-emerald-800/60 group-hover:text-emerald-900 uppercase tracking-wider transition-colors">
                  Kembali ke Portal Wali
                </span>
              </button>
              
              <div className="pt-1.5 text-center text-[8px] text-gray-400 font-bold tracking-tight">
                <p className="uppercase tracking-widest text-[8px] text-emerald-800/55">Developed by <span className="text-emerald-700 font-black">AVHIEV PRODUCTION</span></p>
                <p className="text-[7px] text-gray-400/80 mt-0.5">All Rights Reserved</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Minimalist Footer matching Portal vibe */}
          <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
            <p className="text-[9px] text-emerald-950/20 font-black uppercase tracking-[0.3em]">INTEGRATED ISLAMIC FINANCE ENGINE</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
