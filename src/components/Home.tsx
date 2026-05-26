import { useState, useEffect, useRef, MouseEvent, ReactNode } from "react";
import { Video, Loader2, Sparkles, ArrowRight, Clock, ShieldCheck, Users, Smartphone, ChevronDown, QrCode, AlertTriangle, Calendar, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "react-qr-code";

function MagneticWrapper({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [zoomLink, setZoomLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showQR, setShowQR] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Check browser capability and touch support
  useEffect(() => {
    const isIE = /MSIE|Trident/.test(window.navigator.userAgent);
    const hasWebRTC = !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection);
    setIsBrowserSupported(!isIE && hasWebRTC);
    
    setIsTouchDevice(('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
  }, []);

  // Calculate target time (next 15-minute interval)
  const [targetTime] = useState(() => {
    const now = new Date();
    const target = new Date(now);
    target.setMinutes(Math.ceil((now.getMinutes() + 1) / 15) * 15, 0, 0);
    return target;
  });

  const timeRemaining = Math.max(0, targetTime.getTime() - currentTime.getTime());
  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  const formatTime = (t: number) => t.toString().padStart(2, '0');

  const totalWindowMs = 15 * 60 * 1000;
  const progressPercent = Math.min(100, Math.max(0, 100 - (timeRemaining / totalWindowMs) * 100));

  const getProgressColor = () => {
    if (progressPercent > 90) return 'from-rose-500 to-red-500 shadow-rose-500';
    if (progressPercent > 75) return 'from-amber-500 to-orange-500 shadow-amber-500';
    return 'from-indigo-500 to-sky-500 shadow-indigo-500';
  };

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle keyboard shortcut for Join button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading && zoomLink) {
        window.location.href = getAppProtocolLink(zoomLink);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, zoomLink]);

  const getAppProtocolLink = (url: string | null) => {
    if (!url) return "#";
    try {
      const parsedUrl = new URL(url);
      const pathnameMatch = parsedUrl.pathname.match(/\/j\/(\d+)/);
      if (pathnameMatch && pathnameMatch[1]) {
        const confno = pathnameMatch[1];
        const pwd = parsedUrl.searchParams.get("pwd");
        return `zoommtg://zoom.us/join?action=join&confno=${confno}${pwd ? `&pwd=${pwd}` : ''}`;
      }
    } catch (e) {
      console.error("Link parsing error:", e);
    }
    return url;
  };

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

  useEffect(() => {
    if (!loading && zoomLink) {
      setShowToast(true);
      
      // Play a subtle notification chime
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const actx = new AudioContext();
          const osc = actx.createOscillator();
          const gainNode = actx.createGain();
          
          osc.connect(gainNode);
          gainNode.connect(actx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, actx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(1760, actx.currentTime + 0.1); // A6
          
          gainNode.gain.setValueAtTime(0, actx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.05, actx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5);
          
          osc.start(actx.currentTime);
          osc.stop(actx.currentTime + 0.5);
        }
      } catch (err) {
        console.error('Audio playback failed', err);
      }

      const t = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [loading, zoomLink]);

  const downloadICS = () => {
    if (!zoomLink) return;
    
    // Meeting starts at targetTime and ends 30 minutes later
    const startTimeLocal = targetTime;
    const endTimeLocal = new Date(targetTime.getTime() + 30 * 60000);
    
    // Function to format date into ICS format (YYYYMMDDTHHMMSSZ) using UTC
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startTime = formatICSDate(startTimeLocal);
    const endTime = formatICSDate(endTimeLocal);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Studio Build//Meeting App//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Scheduled Meeting
DTSTART:${startTime}
DTEND:${endTime}
LOCATION:${zoomLink}
DESCRIPTION:Join your scheduled meeting using the following link: ${zoomLink}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT10M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meeting-invite.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyLink = () => {
    if (!zoomLink) return;
    navigator.clipboard.writeText(zoomLink).then(() => {
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    });
  };

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

  const cardVariant = {
    hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 80, damping: 20, mass: 1, delay: 0.1 } 
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] font-sans flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden text-slate-200">
      
      {/* Top Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-800/30 z-50 overflow-hidden">
        <motion.div 
          className={`h-full bg-gradient-to-r ${getProgressColor()} shadow-[0_0_10px]`}
          initial={{ width: `${progressPercent}%` }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

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
            <div className={`relative flex h-3 w-3`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${loading ? 'bg-amber-400' : (zoomLink ? 'bg-emerald-400' : 'bg-slate-400')}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${loading ? 'bg-amber-500' : (zoomLink ? 'bg-emerald-500' : 'bg-slate-500')}`}></span>
            </div>
            <span className={`text-xs font-semibold tracking-widest uppercase ${loading ? 'text-amber-400' : (zoomLink ? 'text-emerald-400' : 'text-slate-400')}`}>
              {loading ? 'Connecting...' : (zoomLink ? 'Session Active' : 'Offline')}
            </span>
          </motion.div>
          <motion.div variants={itemVariant} className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm">{formattedTime}</span>
          </motion.div>
        </div>

        <AnimatePresence>
          {!isBrowserSupported && (
            <motion.div 
              variants={itemVariant}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
              className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4 items-start shadow-lg shadow-amber-900/10"
            >
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h3 className="text-amber-400 font-semibold text-sm">Unsupported Browser Detected</h3>
                <p className="text-amber-200/70 text-xs leading-relaxed">
                  Your browser may not fully support the web meeting experience. For the best reliability and audio/video quality, please consider using Chrome, Firefox, Safari, or Edge.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <motion.div 
          variants={cardVariant}
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

              <div className="flex flex-col items-center mt-6">
                {timeRemaining > 0 ? (
                  <div className="flex items-center gap-4 bg-slate-900/50 px-5 py-3 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-1 font-mono text-2xl font-bold">
                      <span className="bg-slate-950 text-indigo-300 px-3 py-2 rounded-xl border border-indigo-500/20 shadow-inner flex justify-center w-14">
                        {formatTime(minutes)}
                      </span>
                      <span className="text-slate-500 mb-1">:</span>
                      <span className="bg-slate-950 text-indigo-300 px-3 py-2 rounded-xl border border-indigo-500/20 shadow-inner flex justify-center w-14">
                        {formatTime(seconds)}
                      </span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time Until</span>
                      <span className="text-xs font-semibold text-indigo-400">Session Start</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-emerald-400 font-semibold text-sm border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Session is starting now
                  </div>
                )}
              </div>
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
                    key="content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex flex-col items-center"
                  >
                    <div className="w-full flex items-center gap-3">
                      <MagneticWrapper className="flex-1">
                        <motion.a 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={getAppProtocolLink(zoomLink)} 
                          className="group relative flex justify-center items-center gap-3 w-full py-5 bg-white text-slate-900 font-bold rounded-2xl transition-all overflow-hidden shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-sky-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <Sparkles className="w-5 h-5 z-10" />
                          <span className="z-10 text-lg">Join Session</span>
                          <div className="z-10 ml-2 hidden sm:flex items-center gap-1 opacity-60">
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-mono border border-slate-200 font-bold tracking-widest shadow-sm">ENTER ↵</span>
                          </div>
                          <ArrowRight className="w-5 h-5 z-10 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                        </motion.a>
                      </MagneticWrapper>
                      <MagneticWrapper className="w-[72px] shrink-0 sm:w-[84px]">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={copyLink}
                          className="group relative flex justify-center items-center w-full py-5 bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold rounded-2xl border border-slate-600/50 transition-all shadow-lg"
                        >
                          {showCopyToast ? (
                            <Check className="w-5 h-5 z-10 text-emerald-400" />
                          ) : (
                            <Copy className="w-5 h-5 z-10 text-slate-300 group-hover:text-white transition-colors" />
                          )}
                        </motion.button>
                      </MagneticWrapper>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 w-full">
                      <MagneticWrapper>
                        <button
                          onClick={() => setShowQR(!showQR)}
                          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm py-2 px-4 rounded-full hover:bg-slate-800/50"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Join via Mobile</span>
                          <motion.div animate={{ rotate: showQR ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-4 h-4" />
                          </motion.div>
                        </button>
                      </MagneticWrapper>

                      <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-700" />

                      <MagneticWrapper>
                        <button
                          onClick={downloadICS}
                          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm py-2 px-4 rounded-full hover:bg-slate-800/50"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Remind Me (.ics)</span>
                        </button>
                      </MagneticWrapper>
                    </div>

                    <AnimatePresence>
                      {showQR && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, y: -10 }}
                          animate={{ height: "auto", opacity: 1, y: 0 }}
                          exit={{ height: 0, opacity: 0, y: -10 }}
                          className="overflow-hidden w-full flex justify-center mt-2"
                        >
                          <div className="bg-white p-5 rounded-3xl flex flex-col items-center gap-4 shadow-xl shadow-black/50">
                            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 overflow-hidden">
                              <QRCode 
                                value={zoomLink || "#"} 
                                size={140}
                                level="Q"
                                className="rounded-lg"
                              />
                            </div>
                            <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Scan with camera</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

      {/* Mobile Pinned CTA */}
      <AnimatePresence>
        {isTouchDevice && !loading && zoomLink && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 z-40 flex sm:hidden shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)]"
          >
            <a
              href={getAppProtocolLink(zoomLink)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-lg">Tap to Join</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            key="toast-ready"
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            className={`fixed ${isTouchDevice ? 'sm:bottom-8 bottom-32' : 'bottom-8'} left-1/2 z-50 bg-[#0f172a] text-slate-200 px-5 py-3 rounded-full shadow-2xl border border-slate-700/50 flex items-center gap-3 backdrop-blur-xl`}
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="font-medium tracking-wide text-sm whitespace-nowrap">Meeting is ready to join</span>
          </motion.div>
        )}
        
        {showCopyToast && (
          <motion.div
            key="toast-copy"
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            className={`fixed ${isTouchDevice ? 'sm:bottom-24 bottom-48' : 'bottom-24'} left-1/2 z-50 bg-indigo-500/10 text-indigo-300 px-5 py-3 rounded-full shadow-2xl border border-indigo-500/20 flex items-center gap-3 backdrop-blur-xl`}
          >
            <Check className="w-4 h-4" />
            <span className="font-medium tracking-wide text-sm whitespace-nowrap">Link copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
