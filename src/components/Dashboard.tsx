import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings, Save, CheckCircle2, AlertCircle, ArrowLeft, Link as LinkIcon } from "lucide-react";
import { motion } from "motion/react";

export default function Dashboard() {
  const [currentLink, setCurrentLink] = useState("");
  const [newLink, setNewLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/zoom-link")
      .then((res) => res.json())
      .then((data) => {
        setCurrentLink(data.link);
        setNewLink(data.link);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch zoom link:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.trim()) return;

    // Basic validation for URL
    try {
      new URL(newLink);
    } catch (_) {
      setStatus("error");
      setErrorMsg("Please enter a valid URL (e.g. https://zoom.us/j/12345)");
      return;
    }

    setSaving(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/zoom-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link: newLink }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentLink(data.link);
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        throw new Error(data.error || "Failed to update link");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 gap-2 flex items-center">
            <Link to="/" className="hover:text-slate-600 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back
            </Link>
            <span className="text-slate-300">|</span>
            Admin Dashboard
          </h2>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col gap-8">
          
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-slate-900">Current Active Link</h3>
            {loading ? (
              <div className="h-12 bg-slate-50 animate-pulse rounded-xl w-full border border-slate-100"></div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 text-blue-600 rounded-xl border border-slate-200 font-mono text-sm break-all">
                <LinkIcon className="w-4 h-4 shrink-0 text-slate-400" />
                {currentLink}
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6 pt-6 border-t border-slate-100">
            <div className="flex flex-col gap-1 text-slate-900">
              <h3 className="text-lg font-bold">Update Meeting Link</h3>
              <p className="text-sm text-slate-500">Change the destination URL for the public button instantly.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="link-input" className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                  Zoom URL
                </label>
                <input
                  id="link-input"
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {status === "success" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">Link updated successfully!</span>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{errorMsg}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={saving || !newLink.trim() || newLink === currentLink}
                className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-full md:w-auto self-start"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Global Link
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
