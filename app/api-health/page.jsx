"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, CheckCircle2, XCircle, AlertCircle, Zap } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function APIHealthPage() {
  const [health, setHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API}/api/health`);
      const data = await res.json();
      setHealth(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHealth(); }, []);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API}/api/health/check`, { method: "POST" });
      const data = await res.json();
      if (Array.isArray(data)) setHealth(data);
      else fetchHealth();
    } catch (e) { console.error(e); }
    finally { setChecking(false); }
  };

  const StatusIcon = ({ status }) => {
    if (status === "healthy") return <CheckCircle2 size={22} className="text-green-400" />;
    if (status === "degraded") return <AlertCircle size={22} className="text-yellow-400" />;
    if (status === "misconfigured") return <AlertCircle size={22} className="text-orange-400" />;
    return <XCircle size={22} className="text-red-400" />;
  };

  const statusGradient = {
    healthy: "from-green-500/20 to-emerald-500/10 border-green-500/30",
    degraded: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
    misconfigured: "from-orange-500/20 to-amber-500/10 border-orange-500/30",
    down: "from-red-500/20 to-rose-500/10 border-red-500/30",
  };

  const statusLabel = {
    healthy: "Operational",
    degraded: "Degraded",
    misconfigured: "Misconfigured",
    down: "Down",
  };

  // Default demo cards if no data yet
  const displayHealth = health.length > 0 ? health : [
    { api: "RapidAPI (twttrapi)", status: "unknown" },
    { api: "SocialData", status: "unknown" },
    { api: "OpenRouter/OpenAI", status: "unknown" },
    { api: "TwitterAPI.io", status: "unknown" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
      <header className="flex justify-between items-center mb-10">
        <div>
          <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-teal-400 to-green-500 bg-clip-text text-transparent flex items-center gap-3">
            <Activity size={36} className="text-teal-400" /> API Health
          </motion.h1>
          <p className="text-gray-400 mt-2">Daily check on all external API services and credit status</p>
        </div>
        <button onClick={handleCheck} disabled={checking}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-teal-600/20 hover:bg-teal-600 text-teal-200 hover:text-white border border-teal-500/50 transition-all disabled:opacity-50">
          <Zap size={18} className={checking ? "animate-pulse" : ""} /> {checking ? "Checking..." : "Run Check Now"}
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayHealth.map((item, i) => (
            <motion.div key={item.api} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
              className={`relative glass-panel p-6 rounded-2xl border bg-gradient-to-br ${statusGradient[item.status] || "from-white/5 to-white/0 border-white/10"} overflow-hidden`}>
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />

              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white">{item.api}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{item.checked_at ? `Last checked: ${new Date(item.checked_at).toLocaleString()}` : "Not checked yet"}</p>
                </div>
                <StatusIcon status={item.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <p className={`font-black text-lg ${item.status === "healthy" ? "text-green-400" : item.status === "degraded" ? "text-yellow-400" : item.status === "down" ? "text-red-400" : "text-gray-400"}`}>
                    {statusLabel[item.status] || "Unknown"}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Latency</p>
                  <p className="font-black text-lg text-white">{item.latency_ms ? `${item.latency_ms}ms` : "—"}</p>
                </div>
              </div>

              {item.credits_remaining !== undefined && item.credits_remaining !== null && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-4">
                  <p className="text-xs text-purple-300 font-bold">Credits Remaining</p>
                  <p className="text-2xl font-black text-purple-300">{Number(item.credits_remaining).toLocaleString()}</p>
                </div>
              )}

              {item.http_code && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>HTTP {item.http_code}</span>
                  {item.error && <span className="text-red-400 truncate">· {item.error.slice(0, 60)}</span>}
                </div>
              )}
              {!item.http_code && item.error && (
                <p className="text-xs text-red-400 truncate">{item.error.slice(0, 80)}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><RefreshCw size={16} className="text-teal-400" /> Auto-Check Schedule</h3>
        <p className="text-sm text-gray-400">The system automatically runs an API health check at <span className="text-teal-400 font-bold">00:01 every day</span> alongside the posting scheduler. Checks run in the background and results are logged here. You can also trigger an immediate check with the button above.</p>
      </div>
    </div>
  );
}
