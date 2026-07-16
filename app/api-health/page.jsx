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
    if (status === "healthy") return <CheckCircle2 size={18} className="text-green-400" />;
    if (status === "degraded") return <AlertCircle size={18} className="text-yellow-400" />;
    if (status === "misconfigured") return <AlertCircle size={18} className="text-orange-400" />;
    return <XCircle size={18} className="text-red-400" />;
  };

  const statusGradient = {
    healthy: "from-green-500/10 to-transparent border-green-500/20",
    degraded: "from-yellow-500/10 to-transparent border-yellow-500/20",
    misconfigured: "from-orange-500/10 to-transparent border-orange-500/20",
    down: "from-red-500/10 to-transparent border-red-500/20",
  };

  const statusLabel = { healthy: "Operational", degraded: "Degraded", misconfigured: "Misconfigured", down: "Down" };

  const displayHealth = health.length > 0 ? health : [
    { api: "RapidAPI (twttrapi)", status: "unknown" },
    { api: "SocialData", status: "unknown" },
    { api: "OpenRouter/OpenAI", status: "unknown" },
    { api: "TwitterAPI.io", status: "unknown" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <div className="px-7 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-teal-400" /> API Health
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Daily automated checks on external services</p>
        </div>
        <button onClick={handleCheck} disabled={checking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600/15 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 transition-all disabled:opacity-50">
          <Zap size={12} className={checking ? "animate-pulse text-yellow-400" : ""} /> {checking ? "Checking..." : "Run Check Now"}
        </button>
      </div>

      <div className="p-7">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {displayHealth.map((item, i) => (
              <motion.div key={item.api} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                className={`glass-panel p-4 rounded-xl border bg-gradient-to-br ${statusGradient[item.status] || "from-white/5 to-transparent border-white/10"} relative overflow-hidden group hover:border-teal-500/30 transition-all`}>
                
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 pr-2">
                    <h3 className="text-sm font-bold text-white truncate">{item.api}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.checked_at ? new Date(item.checked_at).toLocaleString() : "Not checked yet"}</p>
                  </div>
                  <StatusIcon status={item.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[var(--background)]/50 rounded-lg p-2 border border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Status</p>
                    <p className={`text-xs font-bold ${item.status === "healthy" ? "text-green-400" : item.status === "degraded" ? "text-yellow-400" : item.status === "down" ? "text-red-400" : "text-gray-400"}`}>
                      {statusLabel[item.status] || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-[var(--background)]/50 rounded-lg p-2 border border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Latency</p>
                    <p className="text-xs font-bold text-white">{item.latency_ms ? `${item.latency_ms}ms` : "—"}</p>
                  </div>
                </div>

                {item.credits_remaining !== undefined && item.credits_remaining !== null && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 mb-3">
                    <p className="text-[9px] font-bold text-purple-400/70 uppercase tracking-wider mb-0.5">Credits Remaining</p>
                    <p className="text-sm font-black text-purple-300">{Number(item.credits_remaining).toLocaleString()}</p>
                  </div>
                )}

                {item.error && (
                  <p className="text-[10px] text-red-400/80 bg-red-500/10 p-1.5 rounded border border-red-500/20 line-clamp-2">
                    {item.http_code ? `HTTP ${item.http_code}: ` : ""}{item.error}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-start gap-2.5 bg-teal-500/5 border border-teal-500/10 p-4 rounded-xl max-w-3xl">
          <RefreshCw size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-teal-100 mb-0.5">Automated Daily Check</h4>
            <p className="text-[11px] text-teal-100/60 leading-relaxed">System runs health checks automatically at 00:01 daily. Alerts are triggered on consecutive failures. You can manually check anytime using the button above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
