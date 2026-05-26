import { useState, useEffect } from "react";
import { Video, Loader2, Sparkles, ArrowRight, Clock, ShieldCheck, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Home() {
  const [zoomLink, setZoomLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/zoom-link")
      .then((res) => res.json())
      .then((data) => {
        setZoomLink(data.link);
        // Add a slight delay for smoother intro animations
        setTimeout(() => setLoading(false), 800);
      })
      .catch((err) => {
        console.error("Failed to fetch zoom link:", err);
        setLoading(false);
      });
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] font-sans flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden text-slate-200">
      
      {/* Background Animated Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-indigo-600/15 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.3, 1] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] bg-sky-600/15 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[#030712]/50" />
      </div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header Badges */}
        <div className="flex items-center justify-between mb-8 px-2">
          <motion.div variants={itemVariant} className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">Live Now</span>
          </motion.div>
          <motion.div variants={itemVariant} className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm">{formattedTime}</span>
          </motion.div>
        </div>

        {/* Main Card */}
        <motion.div 
          variants={itemVariant}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-indigo-900/20"
        >
          <div className="flex flex-col items-center text-center gap-6">
            
            <motion.div 
              variants={itemVariant}
              className="relative"
            >
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-3xl rotate-3 shadow-xl flex items-center justify-center p-0.5">
                <div className="absolute inset-0 bg-white/20 rounded-3xl backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity" />
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center -rotate-3 transition-transform hover:rotate-0 duration-300">
                  <Video className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariant} className="space-y-3">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Meeting Room
              </h1>
              <p className="text-slate-400 text-lg max-w-[280px] mx-auto leading-relaxed">
                Your secure session is ready. Please ensure your microphone is configured.
              </p>
            </motion.div>
            
            <motion.div 
              variants={itemVariant} 
              className="w-full pt-4"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex justify-center items-center w-full py-5 bg-slate-800/50 rounded-2xl border border-slate-700/50"
                  >
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="button"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <a 
                      href={zoomLink || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group relative flex justify-center items-center gap-3 w-full py-5 bg-white text-slate-900 font-bold rounded-2xl transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-sky-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Sparkles className="w-5 h-5 z-10" />
                      <span className="z-10 text-lg">Join Session</span>
                      <ArrowRight className="w-5 h-5 z-10 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>
        </motion.div>

        {/* Footer Meta */}
        <motion.div 
          variants={itemVariant}
          className="mt-8 flex flex-row items-center justify-center gap-6 text-slate-500 text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>Encrypted Room</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="w-4 h-4 text-emerald-500/80" />
            <span>Waiting for you</span>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
