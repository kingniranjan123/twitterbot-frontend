"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Play, Pause, Square, ShieldCheck, Loader2, 
  RefreshCw, LogIn, X, Upload, CheckCircle2, XCircle, AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG = {
  active:  { color: "bg-green-500", glow: "shadow-[0_0_8px_rgba(34,197,94,0.8)]", label: "Active" },
  paused:  { color: "bg-yellow-500", glow: "shadow-[0_0_8px_rgba(234,179,8,0.8)]", label: "Paused" },
  held:    { color: "bg-red-500", glow: "shadow-[0_0_8px_rgba(239,68,68,0.8)]", label: "HELD" },
  default: { color: "bg-gray-500", glow: "", label: "Unknown" },
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [isCheckingAlive, setIsCheckingAlive] = useState(false);
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

  const checkPostingStatus = async () => {
    try {
      const r = await fetch(`${API}/status-post`);
      const d = await r.json();
      setIsPosting(d.status === "running");
    } catch {}
  };

  useEffect(() => { fetchAccounts(); checkPostingStatus(); }, []);

  const startStopPosting = async () => {
    const endpoint = isPosting ? "/stop-post" : "/start-post";
    try {
      await fetch(`${API}${endpoint}`, { method: "POST" });
      checkPostingStatus();
    } catch (e) { console.error(e); }
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
      else alert("Re-login failed: " + (data.error || "Unknown error"));
    } catch (e) { alert("Re-login error"); }
    finally { setReloginLoading(prev => ({ ...prev, [twitter_id]: false })); }
  };

  const handleCheckAlive = async () => {
    setIsCheckingAlive(true);
    try {
      await fetch(`${API}/api/accounts/check-alive`, { method: "POST" });
      fetchAccounts();
    } catch (e) { console.error(e); }
    finally { setIsCheckingAlive(false); }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newUsername) return;
    setAdding(true);
    try {
      await fetch(`${API}/api/accounts/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.replace("@", "") }),
      });
      fetchAccounts();
      setShowAddModal(false);
      setNewUsername("");
    } catch (e) { alert("Error adding account"); }
    finally { setAdding(false); }
  };

  // Bulk login: parse the raw text input format
  const parseBulkInput = (raw) => {
    const lines = raw.trim().split("\n").filter(l => l.trim());
    return lines.map(line => {
      // Format: username password twofa email emailpass email2fa location phone - label
      const dashIdx = line.lastIndexOf(" - ");
      const label = dashIdx >= 0 ? line.slice(dashIdx + 3).trim() : "";
      const parts = (dashIdx >= 0 ? line.slice(0, dashIdx) : line).trim().split(/\s+/);
      return {
        username: parts[0] || "",
        password: parts[1] || "",
        twofa_secret: parts[2] || "",
        email: parts[3] || "",
        email_password: parts[4] || "",
        email_2fa: parts[5] || "",
        label: label || parts[0] || "",
      };
    });
  };

  const handleBulkLogin = async () => {
    const accounts = parseBulkInput(bulkInput);
    if (accounts.length === 0) return;
    setBulkLoading(true);
    setBulkResults([]);
    try {
      const res = await fetch(`${API}/auth/bulk-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts }),
      });
      const data = await res.json();
      setBulkResults(data.results || []);
      fetchAccounts();
    } catch (e) { alert("Bulk login error"); }
    finally { setBulkLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
    </div>
  );

  const totals = accounts.reduce((acc, a) => {
    acc[a.account_status || "active"] = (acc[a.account_status || "active"] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent flex items-center gap-3">
            <Users size={36} className="text-purple-400" /> Account Management
          </motion.h1>
          <p className="text-gray-400 mt-2">Manage connected Twitter accounts · {accounts.length} total · {totals.active || 0} active · {totals.paused || 0} paused · {totals.held || 0} held</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleCheckAlive} disabled={isCheckingAlive}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/50 transition-all disabled:opacity-50 text-sm">
            {isCheckingAlive ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {isCheckingAlive ? "Checking..." : "ALIVE CHECK"}
          </button>
          <button onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/50 transition-all text-sm">
            <Upload size={16} /> Bulk Login
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all text-sm">
            <Plus size={16} /> Add Account
          </button>
          <button onClick={startStopPosting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm
              ${isPosting ? "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white" : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105"}`}>
            {isPosting ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {isPosting ? "Stop Posting" : "Start Global Posting"}
          </button>
        </div>
      </header>

      {/* Account Grid */}
      {accounts.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No Accounts Found</h3>
          <p className="mb-6">Connect your first Twitter account to start automating.</p>
          <button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">Add Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {accounts.map((account, index) => {
            const cfg = STATUS_CONFIG[account.account_status] || STATUS_CONFIG.default;
            const isStatusLoading = statusLoading[account.twitter_id];
            const isReloginLoading = reloginLoading[account.twitter_id];
            return (
              <motion.div key={account.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.04 }}
                className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all border border-white/5">
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 rounded-full blur-xl group-hover:opacity-25 transition-opacity" />

                {/* Profile row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="relative cursor-pointer" onClick={() => router.push(`/account/${account.twitter_id}`)}>
                    <img src={account.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="Profile" className="w-14 h-14 rounded-full border-2 border-purple-500/30 object-cover" />
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${cfg.color} ${cfg.glow} border-2 border-[var(--background)]`} title={cfg.label} />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    account.account_status === "held" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                    account.account_status === "paused" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                    "bg-green-500/20 text-green-300 border-green-500/30"
                  }`}>{cfg.label}</span>
                </div>

                {/* Name */}
                <div className="cursor-pointer mb-4" onClick={() => router.push(`/account/${account.twitter_id}`)}>
                  <h3 className="text-lg font-bold text-white">@{account.username}</h3>
                  <p className="text-xs text-gray-500 font-mono truncate">{account.twitter_id}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-white/10">
                  <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Followers</p>
                    <p className="font-bold text-gray-200 text-sm">{(account.followers || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Posted</p>
                    <p className="font-bold text-gray-200 text-sm">{account.collected_tweets || 0}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5">
                  {account.account_status === "paused" || account.account_status === "held" ? (
                    <button onClick={() => setAccountStatus(account.twitter_id, "active")} disabled={!!isStatusLoading}
                      title="Activate" className="flex items-center justify-center py-2 rounded-lg bg-green-600/20 hover:bg-green-600 text-green-300 hover:text-white border border-green-500/30 transition-all disabled:opacity-50 text-xs font-bold gap-1">
                      <Play size={13} fill="currentColor" /> {isStatusLoading === "active" ? "..." : "Run"}
                    </button>
                  ) : (
                    <button onClick={() => setAccountStatus(account.twitter_id, "paused")} disabled={!!isStatusLoading}
                      title="Pause" className="flex items-center justify-center py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500 text-yellow-300 hover:text-white border border-yellow-500/20 transition-all disabled:opacity-50 text-xs font-bold gap-1">
                      <Pause size={13} /> {isStatusLoading === "paused" ? "..." : "Pause"}
                    </button>
                  )}
                  <button onClick={() => handleRelogin(account.twitter_id)} disabled={!!isReloginLoading}
                    title="Re-Login" className="flex items-center justify-center py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all disabled:opacity-50 text-xs font-bold">
                    {isReloginLoading ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                  </button>
                  <button onClick={() => router.push(`/account/${account.twitter_id}`)}
                    title="Settings" className="flex items-center justify-center py-2 rounded-lg bg-white/5 hover:bg-purple-600/30 text-gray-400 hover:text-purple-300 border border-white/10 transition-all text-xs font-bold">
                    ⚙
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-8 rounded-2xl max-w-md w-full border border-purple-500/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Account</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="@username"
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500/50 placeholder-gray-500" />
                <button type="submit" disabled={adding || !newUsername}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                  {adding ? "Adding..." : "Add Account"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Login Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-8 rounded-2xl max-w-2xl w-full border border-blue-500/30">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Upload size={22} className="text-blue-400" /> Bulk Login</h2>
                <button onClick={() => { setShowBulkModal(false); setBulkResults([]); }} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-gray-400 text-sm mb-4">One account per line in the format:<br />
                <code className="text-blue-300 text-xs">username password 2FA_secret email email_pass email_2fa location phone - Label</code>
              </p>
              <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                rows={6} placeholder="brianneedsmods AlmyL5@NuwYX VMCZEAEOA4DQM2LX parkercdillon@hotmail.com JtDecDqFnPqr 6fnxid94wpv8 United States 15092244620 - Kannigal"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500/50 placeholder-gray-600 mb-4 resize-none" />
              <button onClick={handleBulkLogin} disabled={bulkLoading || !bulkInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mb-4">
                {bulkLoading ? "Logging in..." : `Login ${parseBulkInput(bulkInput).length} Account(s)`}
              </button>
              {bulkResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bulkResults.map((r, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${r.status === "success" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                      {r.status === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span className="font-bold">{r.label || r.username}</span>
                      <span className="text-xs opacity-70">— {r.status}{r.error ? `: ${r.error}` : ""}</span>
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

  function parseBulkInput(raw) {
    const lines = raw.trim().split("\n").filter(l => l.trim());
    return lines.map(line => {
      const dashIdx = line.lastIndexOf(" - ");
      const label = dashIdx >= 0 ? line.slice(dashIdx + 3).trim() : "";
      const parts = (dashIdx >= 0 ? line.slice(0, dashIdx) : line).trim().split(/\s+/);
      return { username: parts[0] || "", password: parts[1] || "", twofa_secret: parts[2] || "", label: label || parts[0] || "" };
    });
  }
}
