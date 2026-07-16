"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Play, Pause, LogIn, X,
  Upload, CheckCircle2, XCircle, ShieldCheck, Loader2, Settings
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG = {
  active:  { dot: "bg-green-500", badge: "text-green-400 bg-green-400/10 border-green-400/25", label: "Active" },
  paused:  { dot: "bg-yellow-400", badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/25", label: "Paused" },
  held:    { dot: "bg-red-500 animate-pulse", badge: "text-red-400 bg-red-400/10 border-red-400/25", label: "HELD" },
  unknown: { dot: "bg-gray-500", badge: "text-gray-400 bg-gray-400/10 border-gray-400/25", label: "Unknown" },
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [checkingAlive, setCheckingAlive] = useState(false);
  const [statusLoading, setStatusLoading] = useState({});
  const [reloginLoading, setReloginLoading] = useState({});
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const router = useRouter();

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API}/api/accounts`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const parseBulkInput = (raw) => {
    return raw.trim().split("\n").filter(l => l.trim()).map(line => {
      const dashIdx = line.lastIndexOf(" - ");
      const label = dashIdx >= 0 ? line.slice(dashIdx + 3).trim() : "";
      const parts = (dashIdx >= 0 ? line.slice(0, dashIdx) : line).trim().split(/\s+/);
      return { username: parts[0] || "", password: parts[1] || "", twofa_secret: parts[2] || "", label: label || parts[0] || "" };
    });
  };

  const setAccountStatus = async (twitter_id, status) => {
    setStatusLoading(prev => ({ ...prev, [twitter_id]: status }));
    try {
      await fetch(`${API}/api/accounts/${twitter_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchAccounts();
    } catch (e) { console.error(e); }
    finally { setStatusLoading(prev => ({ ...prev, [twitter_id]: null })); }
  };

  const handleRelogin = async (twitter_id) => {
    setReloginLoading(prev => ({ ...prev, [twitter_id]: true }));
    try {
      const res = await fetch(`${API}/auth/relogin/${twitter_id}`, { method: "POST" });
      const data = await res.json();
      if (data.success) fetchAccounts();
    } catch (e) { console.error(e); }
    finally { setReloginLoading(prev => ({ ...prev, [twitter_id]: false })); }
  };

  const handleCheckAlive = async () => {
    setCheckingAlive(true);
    try {
      await fetch(`${API}/api/accounts/check-alive`, { method: "POST" });
      fetchAccounts();
    } catch (e) { console.error(e); }
    finally { setCheckingAlive(false); }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newUsername) return;
    setAdding(true);
    try {
      await fetch(`${API}/api/accounts/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.replace("@", "") }),
      });
      fetchAccounts(); setShowAddModal(false); setNewUsername("");
    } catch (e) { alert("Error adding account"); }
    finally { setAdding(false); }
  };

  const handleBulkLogin = async () => {
    const accs = parseBulkInput(bulkInput);
    if (!accs.length) return;
    setBulkLoading(true); setBulkResults([]);
    try {
      const res = await fetch(`${API}/auth/bulk-login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: accs }),
      });
      const data = await res.json();
      setBulkResults(data.results || []);
      fetchAccounts();
    } catch (e) { alert("Bulk login error"); }
    finally { setBulkLoading(false); }
  };

  const counts = accounts.reduce((a, acc) => {
    const s = acc.account_status || "unknown";
    a[s] = (a[s] || 0) + 1; return a;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ── Header ── */}
      <div className="px-7 pt-6 pb-4 border-b border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-purple-400" /> Account Management
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {accounts.length} total · <span className="text-green-400">{counts.active || 0} active</span> · <span className="text-yellow-400">{counts.paused || 0} paused</span> · <span className="text-red-400">{counts.held || 0} held</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleCheckAlive} disabled={checkingAlive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all disabled:opacity-50">
              {checkingAlive ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              Alive Check
            </button>
            <button onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all">
              <Upload size={12} /> Bulk Login
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/8 hover:bg-white/15 text-gray-300 border border-white/10 transition-all">
              <Plus size={12} /> Add Account
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="p-7">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>
        ) : accounts.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-white mb-1">No accounts found</p>
            <p className="text-sm">Add your first account to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {accounts.map((account, i) => {
              const cfg = STATUS_CONFIG[account.account_status] || STATUS_CONFIG.unknown;
              return (
                <motion.div key={account.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-panel rounded-xl border border-white/5 hover:border-purple-500/30 transition-all flex flex-col overflow-hidden group">

                  {/* Card top — avatar + status */}
                  <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/account/${account.twitter_id}`)}>
                    <div className="relative flex-shrink-0">
                      <img src={account.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt=""
                        className="w-10 h-10 rounded-full object-cover border border-white/10" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--background)] ${cfg.dot}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">@{account.username}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-4 pb-3 flex gap-4 text-[11px] text-gray-400">
                    <div><span className="text-white font-semibold">{(account.followers || 0).toLocaleString()}</span> followers</div>
                    <div><span className="text-white font-semibold">{account.collected_tweets || 0}</span> posts</div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-3 pb-3 grid grid-cols-4 gap-1.5 mt-auto">
                    {/* Run / Pause toggle */}
                    {account.account_status === "paused" || account.account_status === "held" ? (
                      <button onClick={() => setAccountStatus(account.twitter_id, "active")}
                        disabled={!!statusLoading[account.twitter_id]}
                        title="Activate" className="col-span-2 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold bg-green-600/15 hover:bg-green-600/30 text-green-400 border border-green-500/25 transition-all disabled:opacity-40">
                        {statusLoading[account.twitter_id] === "active" ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} fill="currentColor" />}
                        Run
                      </button>
                    ) : (
                      <button onClick={() => setAccountStatus(account.twitter_id, "paused")}
                        disabled={!!statusLoading[account.twitter_id]}
                        title="Pause" className="col-span-2 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold bg-yellow-500/10 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/20 transition-all disabled:opacity-40">
                        {statusLoading[account.twitter_id] === "paused" ? <Loader2 size={11} className="animate-spin" /> : <Pause size={11} />}
                        Pause
                      </button>
                    )}

                    {/* Re-login */}
                    <button onClick={() => handleRelogin(account.twitter_id)}
                      disabled={!!reloginLoading[account.twitter_id]}
                      title="Re-Login" className="flex items-center justify-center py-1.5 rounded-lg text-[11px] bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 border border-blue-500/25 transition-all disabled:opacity-40">
                      {reloginLoading[account.twitter_id] ? <Loader2 size={11} className="animate-spin" /> : <LogIn size={11} />}
                    </button>

                    {/* Settings */}
                    <button onClick={() => router.push(`/account/${account.twitter_id}`)}
                      title="Settings" className="flex items-center justify-center py-1.5 rounded-lg text-[11px] bg-white/5 hover:bg-purple-600/20 text-gray-500 hover:text-purple-400 border border-white/8 transition-all">
                      <Settings size={11} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Account Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-2xl w-full max-w-sm border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-white">Add Account</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
              </div>
              <form onSubmit={handleAddAccount} className="space-y-3">
                <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="@username"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-purple-500/50 placeholder-gray-600" />
                <button type="submit" disabled={adding || !newUsername}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
                  {adding ? "Adding..." : "Add Account"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Bulk Login Modal ── */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-2xl w-full max-w-xl border border-blue-500/20">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2"><Upload size={16} className="text-blue-400" /> Bulk Login</h2>
                <button onClick={() => { setShowBulkModal(false); setBulkResults([]); }} className="text-gray-500 hover:text-white"><X size={16} /></button>
              </div>
              <p className="text-xs text-gray-500 mb-3">Format: <code className="text-blue-400">username password 2fa_secret email email_pass - Label</code></p>
              <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                rows={5} placeholder={"brianneedsmods AlmyL5@NuwYX VMCZEAEOA4DQM2LX parkercdillon@hotmail.com pass - Kannigal"}
                className="w-full bg-white/5 border border-white/10 text-white text-xs font-mono px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500/50 placeholder-gray-600 resize-none mb-3" />
              <button onClick={handleBulkLogin} disabled={bulkLoading || !bulkInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 mb-3">
                {bulkLoading ? "Logging in..." : `Login ${parseBulkInput(bulkInput).length} Account(s)`}
              </button>
              {bulkResults.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {bulkResults.map((r, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${r.status === "success" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                      {r.status === "success" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span className="font-semibold">{r.label || r.username}</span>
                      <span className="opacity-60">— {r.status}{r.error ? `: ${r.error}` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
