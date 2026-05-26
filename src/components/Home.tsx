import { useState, useEffect } from "react";
import { Video, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function Home() {
  const [zoomLink, setZoomLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/zoom-link")
      .then((res) => res.json())
      .then((data) => {
        setZoomLink(data.link);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch zoom link:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden"
      >
        <div className="h-40 bg-slate-900 p-8 flex flex-col justify-end gap-2">
          <p className="text-blue-400 text-sm font-medium">Live Session</p>
          <h1 className="text-white text-3xl font-semibold">Join the Meeting</h1>
        </div>
        
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
            <Video className="w-10 h-10 text-slate-400" />
          </div>
          
          <div className="space-y-1">
            <p className="text-slate-600 font-medium">The meeting is ready.</p>
            <p className="text-slate-400 text-sm">Click the button below to enter the Zoom room.</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center w-full py-4 bg-blue-50 rounded-2xl">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            <a 
              href={zoomLink || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2"
            >
              <Video className="w-5 h-5" />
              Join Zoom Meeting
            </a>
          )}

          <div className="w-full pt-6 border-t border-slate-100 mt-2">
            <Link to="/dashboard" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
