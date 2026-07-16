"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, RefreshCw, Play, Trash2, AlertOctagon } from "lucide-react";

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
    if (status === "loading") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    if (status === "success") return "bg-green-500/20 text-green-300 border-green-500/30";
    if (status === "failed") return "bg-red-500/20 text-red-300 border-red-500/30";
    return "bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white border-blue-500/50";
  };

  const reloginLabel = (status) => {
    if (status === "loading") return "Logging in...";
    if (status === "success") return "✓ Logged In!";
    if (status === "failed") return "✗ Login Failed";
    return "Re-Login";
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
      <header className="flex justify-between items-center mb-10">
        <div>
          <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-red-400 via-rose-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <ShieldAlert size={36} className="text-red-400" /> HELD Accounts
          </motion.h1>
          <p className="text-gray-400 mt-2">Accounts that require manual intervention (4+ consecutive post failures)</p>
        </div>
        <button onClick={fetchHeld} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/20 text-gray-300 border border-white/10 transition-all">
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" /></div>
      ) : accounts.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <ShieldAlert size={60} className="mx-auto mb-5 text-green-400 opacity-70" />
          <h3 className="text-2xl font-bold text-white mb-3">All Clear!</h3>
          <p className="text-gray-400">No accounts are currently in HELD state. All accounts are operational.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc, i) => (
            <motion.div key={acc.twitter_id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.07 }}
              className="glass-panel p-6 rounded-2xl border border-red-500/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500" />
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/10 rounded-full blur-xl" />

              <div className="flex items-start gap-4 mb-5">
                <div className="relative">
                  <img src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="avatar" className="w-14 h-14 rounded-full border-2 border-red-500/40" />
                  <AlertOctagon size={16} className="absolute -bottom-1 -right-1 text-red-400 bg-[var(--background)] rounded-full" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">@{acc.username}</h3>
                  <p className="text-xs text-gray-500 font-mono">{acc.twitter_id}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    🔴 HELD
                  </span>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
                <p className="text-xs text-red-300 font-bold mb-1">Consecutive Failures</p>
                <p className="text-3xl font-black text-red-400">{acc.consecutive_failures || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{acc.has_session ? "Has session (may be expired)" : "No session stored"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleRelogin(acc.twitter_id)} disabled={reloginStatus[acc.twitter_id] === "loading"}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm border transition-all disabled:opacity-50 ${reloginBtnStyle(reloginStatus[acc.twitter_id])}`}>
                  <RefreshCw size={14} className={reloginStatus[acc.twitter_id] === "loading" ? "animate-spin" : ""} />
                  {reloginLabel(reloginStatus[acc.twitter_id])}
                </button>
                <button onClick={() => handleForceActivate(acc.twitter_id)} disabled={activating[acc.twitter_id]}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-green-600/20 hover:bg-green-600 text-green-300 hover:text-white border border-green-500/30 transition-all disabled:opacity-50">
                  <Play size={14} fill="currentColor" /> {activating[acc.twitter_id] ? "..." : "Force Active"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
