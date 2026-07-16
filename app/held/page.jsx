"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, RefreshCw, Play, AlertOctagon, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function HeldAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloginStatus, setReloginStatus] = useState({});
  const [activating, setActivating] = useState({});

  const fetchHeld = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/accounts/held`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHeld(); }, []);

  const handleRelogin = async (twitter_id) => {
    setReloginStatus(prev => ({ ...prev, [twitter_id]: "loading" }));
    try {
      const res = await fetch(`${API}/auth/relogin/${twitter_id}`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setReloginStatus(prev => ({ ...prev, [twitter_id]: "success" }));
        setTimeout(() => fetchHeld(), 1500);
      } else {
        setReloginStatus(prev => ({ ...prev, [twitter_id]: "failed" }));
      }
    } catch (e) {
      setReloginStatus(prev => ({ ...prev, [twitter_id]: "failed" }));
    }
  };

  const handleForceActivate = async (twitter_id) => {
    setActivating(prev => ({ ...prev, [twitter_id]: true }));
    try {
      await fetch(`${API}/api/accounts/${twitter_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" })
      });
      fetchHeld();
    } catch (e) { console.error(e); }
    finally { setActivating(prev => ({ ...prev, [twitter_id]: false })); }
  };

  const reloginBtnStyle = (status) => {
    if (status === "loading") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/25";
    if (status === "success") return "bg-green-500/15 text-green-400 border-green-500/25";
    if (status === "failed") return "bg-red-500/15 text-red-400 border-red-500/25";
    return "bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 border-blue-500/25";
  };

  const reloginLabel = (status) => {
    if (status === "loading") return "Logging in...";
    if (status === "success") return "Logged In!";
    if (status === "failed") return "Failed";
    return "Re-Login";
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <div className="px-7 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-400" /> HELD Accounts
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Accounts requiring manual intervention (4+ failures)</p>
        </div>
        <button onClick={fetchHeld} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="p-7">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div>
        ) : accounts.length === 0 ? (
          <div className="glass-panel p-10 rounded-xl text-center border border-white/5 max-w-lg mx-auto">
            <ShieldAlert size={40} className="mx-auto mb-3 text-green-400 opacity-50" />
            <h3 className="text-sm font-bold text-white mb-1">All Clear!</h3>
            <p className="text-xs text-gray-400">No accounts are currently in HELD state. Systems normal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {accounts.map((acc, i) => (
              <motion.div key={acc.twitter_id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="glass-panel p-4 rounded-xl border border-red-500/20 relative overflow-hidden group hover:border-red-500/40 transition-all">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 to-rose-500" />

                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="" className="w-10 h-10 rounded-full border border-red-500/40 object-cover" />
                    <AlertOctagon size={12} className="absolute -bottom-1 -right-1 text-red-500 bg-[var(--background)] rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">@{acc.username}</h3>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">HELD</span>
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 mb-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Failures</p>
                    <p className="text-lg font-black text-red-400 leading-none mt-0.5">{acc.consecutive_failures || 0}</p>
                  </div>
                  <div className="text-[10px] text-gray-500 text-right">
                    {acc.has_session ? "Session exists" : "No session"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleRelogin(acc.twitter_id)} disabled={reloginStatus[acc.twitter_id] === "loading"}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${reloginBtnStyle(reloginStatus[acc.twitter_id])}`}>
                    {reloginStatus[acc.twitter_id] === "loading" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {reloginLabel(reloginStatus[acc.twitter_id])}
                  </button>
                  <button onClick={() => handleForceActivate(acc.twitter_id)} disabled={activating[acc.twitter_id]}
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-green-600/15 hover:bg-green-600/30 text-green-400 border border-green-500/25 transition-all disabled:opacity-50">
                    {activating[acc.twitter_id] ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                    Force Active
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
