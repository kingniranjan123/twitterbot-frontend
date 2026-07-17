"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Play, Pause, LogIn, X, Upload, ShieldCheck, Loader2, Settings, MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG = {
  active:  { dot: "bg-green-500", text: "text-green-400", label: "Active" },
  paused:  { dot: "bg-yellow-400", text: "text-yellow-400", label: "Paused" },
  held:    { dot: "bg-red-500 animate-pulse", text: "text-red-400", label: "HELD" },
  unknown: { dot: "bg-gray-500", text: "text-gray-400", label: "Unknown" },
};

// Simple Click-Outside Hook
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

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
  const [openDropdown, setOpenDropdown] = useState(null);
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
    setOpenDropdown(null);
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
    setOpenDropdown(null);
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

  const handlePostNow = async (twitter_id) => {
    try {
      const res = await fetch(`${API}/api/account/${twitter_id}/post-now`, { method: "POST" });
      const data = await res.json();
      alert(data.message);
      fetchAccounts();
    } catch (e) {
      alert("Error calling Post Now: " + String(e));
    }
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

  // Dropdown Component for each row
  const ActionDropdown = ({ account }) => {
    const ref = useRef(null);
    const isOpen = openDropdown === account.twitter_id;
    useOnClickOutside(ref, () => { if (isOpen) setOpenDropdown(null); });

    const toggle = (e) => {
      e.stopPropagation();
      setOpenDropdown(isOpen ? null : account.twitter_id);
    };

    return (
      <div className="relative" ref={ref}>
        <button onClick={toggle} className="p-1.5 rounded hover:bg-white/10 text-gray-400 transition-colors">
          {statusLoading[account.twitter_id] || reloginLoading[account.twitter_id] ? (
            <Loader2 size={14} className="animate-spin text-purple-400" />
          ) : (
            <MoreHorizontal size={14} />
          )}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.1 }}
              className="absolute right-0 top-full mt-1 w-32 bg-[#1a1b23] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
              
              {account.account_status === "paused" || account.account_status === "held" ? (
                <button onClick={(e) => { e.stopPropagation(); setAccountStatus(account.twitter_id, "active"); }} className="w-full px-3 py-2 text-left text-[11px] text-gray-300 hover:bg-white/5 hover:text-green-400 flex items-center gap-2">
                  <Play size={12} fill="currentColor" /> Run Account
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setAccountStatus(account.twitter_id, "paused"); }} className="w-full px-3 py-2 text-left text-[11px] text-gray-300 hover:bg-white/5 hover:text-yellow-400 flex items-center gap-2">
                  <Pause size={12} /> Pause Account
                </button>
              )}
              
              <button onClick={(e) => { e.stopPropagation(); handleRelogin(account.twitter_id); }} className="w-full px-3 py-2 text-left text-[11px] text-gray-300 hover:bg-white/5 hover:text-blue-400 flex items-center gap-2">
                <LogIn size={12} /> Re-Login
              </button>
              
              <div className="h-px bg-white/10 my-1"></div>
              
              <button onClick={(e) => { e.stopPropagation(); handlePostNow(account.twitter_id); }} className="w-full px-3 py-2 text-left text-[11px] text-gray-300 hover:bg-white/5 hover:text-green-400 flex items-center gap-2">
                <Play size={12} /> Post Now
              </button>
              
              <button onClick={(e) => { e.stopPropagation(); router.push(`/account/${account.twitter_id}`); }} className="w-full px-3 py-2 text-left text-[11px] text-gray-300 hover:bg-white/5 hover:text-purple-400 flex items-center gap-2">
                <Settings size={12} /> Settings
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-[#111116] sticky top-0 z-40">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-purple-400" /> Account Management
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {accounts.length} total · <span className="text-green-400">{counts.active || 0} active</span> · <span className="text-yellow-400">{counts.paused || 0} paused</span> · <span className="text-red-400">{counts.held || 0} held</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCheckAlive} disabled={checkingAlive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20 transition-all disabled:opacity-50">
            {checkingAlive ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
            Alive Check
          </button>
          <button onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/20 transition-all">
            <Upload size={12} /> Bulk Login
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all">
            <Plus size={12} /> Add Account
          </button>
        </div>
      </div>

      {/* ── List View (Table) ── */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" /></div>
        ) : accounts.length === 0 ? (
          <div className="border border-dashed border-white/10 p-12 rounded-lg text-center text-gray-500">
            <p className="font-semibold text-white text-sm mb-1">No accounts found</p>
            <p className="text-[11px]">Add your first account to get started.</p>
          </div>
        ) : (
          <div className="border border-white/5 rounded-lg overflow-x-auto bg-[#13141a]">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 bg-[#16171f] whitespace-nowrap">
                  <th className="px-3 py-3 font-semibold w-8">#</th>
                  <th className="px-3 py-3 font-semibold">Account</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Health</th>
                  <th className="px-3 py-3 font-semibold">Extracted</th>
                  <th className="px-3 py-3 font-semibold">Posted Today</th>
                  <th className="px-3 py-3 font-semibold">Last Extracted</th>
                  <th className="px-3 py-3 font-semibold">Last Posted</th>
                  <th className="px-3 py-3 font-semibold">Next Post Est.</th>
                  <th className="px-3 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accounts.map((account, i) => {
                  const cfg = STATUS_CONFIG[account.account_status] || STATUS_CONFIG.unknown;
                  let health = { text: "text-green-400", label: "Healthy" };
                  if (account.consecutive_failures >= 3) {
                      health = { text: "text-red-400", label: "HELD" };
                  } else if (account.consecutive_failures > 0) {
                      health = { text: "text-yellow-400", label: "Warning" };
                  }

                  const formatDate = (d) => {
                    if (!d) return "N/A";
                    return new Date(d).toLocaleString();
                  };
                  
                  let nextPostEst = "N/A";
                  if (account.last_post && account.post_delay_seconds) {
                    const nextTime = new Date(new Date(account.last_post).getTime() + account.post_delay_seconds * 1000);
                    nextPostEst = nextTime > new Date() ? nextTime.toLocaleString() : "Now";
                  } else if (account.collected_tweets > 0 && account.account_status === "active") {
                    nextPostEst = "Now";
                  }

                  return (
                    <tr key={account.id} onClick={() => router.push(`/account/${account.twitter_id}`)}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group whitespace-nowrap">
                      <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img src={account.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="" 
                            className="w-5 h-5 rounded-full object-cover border border-white/10" />
                          <span className="font-semibold text-gray-200">@{account.username}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span className={`${cfg.text} font-medium`}>{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium">
                        <span className={health.text}>{health.label}</span>
                        {account.consecutive_failures > 0 && <span className="text-gray-500 ml-1">({account.consecutive_failures})</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-400">{account.collected_tweets || 0}</td>
                      <td className="px-3 py-2 text-gray-400">{account.posted_today || 0}</td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(account.last_extract)}</td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(account.last_post)}</td>
                      <td className="px-3 py-2 text-blue-400">{nextPostEst}</td>
                      <td className="px-3 py-2 text-right" onClick={e => e.stopPropagation()}>
                        <ActionDropdown account={account} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Account Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b23] p-5 rounded-xl w-full max-w-xs border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-white">Add Account</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
              </div>
              <form onSubmit={handleAddAccount} className="space-y-3">
                <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="@username"
                  className="w-full bg-black/20 border border-white/10 text-white text-[11px] px-3 py-2 rounded focus:outline-none focus:border-purple-500/50 placeholder-gray-600" />
                <button type="submit" disabled={adding || !newUsername}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold py-2 rounded transition-colors disabled:opacity-50">
                  {adding ? "Adding..." : "Add"}
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
              className="bg-[#1a1b23] p-5 rounded-xl w-full max-w-lg border border-blue-500/20 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><Upload size={14} className="text-blue-400" /> Bulk Login</h2>
                <button onClick={() => { setShowBulkModal(false); setBulkResults([]); }} className="text-gray-500 hover:text-white"><X size={14} /></button>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">Format: <code className="text-blue-400">username password 2fa_secret email email_pass - Label</code></p>
              <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)}
                rows={5} placeholder={"brianneedsmods AlmyL5@NuwYX VMCZEAEOA4DQM2LX parkercdillon@hotmail.com pass - Kannigal"}
                className="w-full bg-black/20 border border-white/10 text-white text-[10px] font-mono px-3 py-2 rounded focus:outline-none focus:border-blue-500/50 placeholder-gray-700 resize-none mb-3" />
              <button onClick={handleBulkLogin} disabled={bulkLoading || !bulkInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold py-2 rounded transition-colors disabled:opacity-50 mb-3">
                {bulkLoading ? "Logging in..." : `Login ${parseBulkInput(bulkInput).length} Account(s)`}
              </button>
              {bulkResults.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto bg-black/20 rounded border border-white/5 p-2">
                  {bulkResults.map((r, i) => (
                    <div key={i} className={`flex items-center gap-1.5 p-1.5 rounded text-[10px] ${r.status === "success" ? "text-green-400" : "text-red-400"}`}>
                      {r.status === "success" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      <span className="font-semibold text-gray-200">{r.label || r.username}</span>
                      <span className="opacity-70">— {r.status}{r.error ? `: ${r.error}` : ""}</span>
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
