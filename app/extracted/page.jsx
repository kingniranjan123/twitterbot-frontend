"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileDown, Trash2, UploadCloud, RefreshCw, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_DOT = { active: "bg-green-500", paused: "bg-yellow-400", held: "bg-red-500" };

export default function ExtractedTweetsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [extracting, setExtracting] = useState({});
  const [clearing, setClearing] = useState({});
  const [uploading, setUploading] = useState({});
  const [globalExtracting, setGlobalExtracting] = useState(false);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const fileRefs = useRef({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API}/tweets/extracted/summary`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const fetchTweets = async (user_id) => {
    setTweetsLoading(true);
    try {
      const res = await fetch(`${API}/tweets/extracted/${user_id}`);
      const data = await res.json();
      setTweets(data.tweets || []);
    } catch (e) { console.error(e); }
    finally { setTweetsLoading(false); }
  };

  const selectAccount = (acc) => {
    setSelected(acc);
    fetchTweets(acc.user_id);
  };

  const handleExtract = async (twitter_id) => {
    setExtracting(prev => ({ ...prev, [twitter_id]: true }));
    try {
      const res = await fetch(`${API}/tweets/extract/manual/${twitter_id}`, { method: "POST" });
      const data = await res.json();
      showToast(data.message || "Extraction started!");
    } catch (e) { showToast("Extraction failed", "error"); }
    finally { setExtracting(prev => ({ ...prev, [twitter_id]: false })); }
  };

  const handleClear = async (user_id, username) => {
    if (!confirm(`Clear ALL extracted tweets for @${username}? This cannot be undone.`)) return;
    setClearing(prev => ({ ...prev, [user_id]: true }));
    try {
      await fetch(`${API}/tweets/extracted/${user_id}/clear`, { method: "DELETE" });
      showToast(`Cleared tweets for @${username}`);
      fetchAccounts();
      if (selected?.user_id === user_id) setTweets([]);
    } catch (e) { showToast("Clear failed", "error"); }
    finally { setClearing(prev => ({ ...prev, [user_id]: false })); }
  };

  const handleClearAll = async () => {
    setClearAllConfirm(false);
    try {
      await fetch(`${API}/tweets/extracted/clear-all`, { method: "DELETE" });
      showToast("All historical tweets cleared!");
      fetchAccounts();
      setTweets([]);
    } catch (e) { showToast("Clear all failed", "error"); }
  };

  const handleGlobalExtract = async () => {
    setGlobalExtracting(true);
    try {
      const res = await fetch(`${API}/tweets/extract/manual/all`, { method: "POST" });
      const data = await res.json();
      showToast(data.message || "Global extraction started!");
    } catch (e) { showToast("Global extraction failed", "error"); }
    finally { setGlobalExtracting(false); }
  };

  const handleUpload = async (user_id, twitter_id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(prev => ({ ...prev, [user_id]: true }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/tweets/extracted/${user_id}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      showToast(data.message || "Upload complete!");
      fetchAccounts();
      if (selected?.user_id === user_id) fetchTweets(user_id);
    } catch (e) { showToast("Upload failed", "error"); }
    finally { setUploading(prev => ({ ...prev, [user_id]: false })); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Toast */}
      {toast && (
        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
          className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg flex items-center gap-2 ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
          {toast.type === "error" ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />} {toast.msg}
        </motion.div>
      )}

      {/* Clear All Confirm Modal */}
      <AnimatePresence>
        {clearAllConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-2xl w-full max-w-sm border border-red-500/30 text-center">
              <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
              <h2 className="text-base font-bold text-white mb-2">Confirm Clear All</h2>
              <p className="text-xs text-gray-400 mb-5">This will permanently delete ALL extracted tweets across ALL accounts. This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={handleClearAll} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">Yes, Delete All</button>
                <button onClick={() => setClearAllConfirm(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="px-7 pt-6 pb-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileDown size={20} className="text-blue-400" /> Extracted Tweets
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage and upload collected tweets for each account</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleGlobalExtract} disabled={globalExtracting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all disabled:opacity-50">
            <RefreshCw size={12} className={globalExtracting ? "animate-spin" : ""} /> {globalExtracting ? "Extracting..." : "Extract All"}
          </button>
          <button onClick={() => setClearAllConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/15 hover:bg-red-600/30 text-red-300 border border-red-500/30 transition-all">
            <Trash2 size={12} /> Clear All
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row h-[calc(100vh-80px)] overflow-hidden">
        {/* Left: Accounts List */}
        <div className="w-full xl:w-80 flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 bg-white/[0.01]">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full" /></div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc, i) => (
                <motion.div key={acc.twitter_id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.02 }}
                  onClick={() => selectAccount(acc)}
                  className={`glass-panel p-3 rounded-xl cursor-pointer transition-all hover:border-blue-500/30 border ${selected?.twitter_id === acc.twitter_id ? "border-blue-500/50 bg-blue-500/5" : "border-white/5"}`}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="relative">
                      <img src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--background)] ${STATUS_DOT[acc.account_status] || "bg-gray-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">@{acc.username}</p>
                      <p className="text-[10px] text-gray-400">{acc.tweet_count || 0} tweets</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleExtract(acc.twitter_id)} disabled={extracting[acc.twitter_id]}
                      className="flex-1 text-[10px] py-1 rounded bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 font-semibold disabled:opacity-50">
                      {extracting[acc.twitter_id] ? "..." : "Extract"}
                    </button>
                    <button onClick={() => fileRefs.current[acc.user_id]?.click()} disabled={uploading[acc.user_id]}
                      className="flex-1 text-[10px] py-1 rounded bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 font-semibold disabled:opacity-50">
                      {uploading[acc.user_id] ? "..." : "Upload"}
                    </button>
                    <input type="file" accept=".xlsx,.csv" className="hidden" ref={el => fileRefs.current[acc.user_id] = el}
                      onChange={e => handleUpload(acc.user_id, acc.twitter_id, e)} />
                    <button onClick={() => handleClear(acc.user_id, acc.username)} disabled={clearing[acc.user_id]}
                      className="px-2 py-1 rounded bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/15 disabled:opacity-50">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Tweet List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <FileDown size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Select an account to view extracted tweets.</p>
            </div>
          ) : tweetsLoading ? (
            <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" /></div>
          ) : tweets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">No extracted tweets found for @{selected.username}.</div>
          ) : (
            <div className="space-y-2 max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <img src={selected.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="" className="w-5 h-5 rounded-full" />
                  @{selected.username}
                </h3>
                <span className="text-xs text-gray-400">{tweets.length} tweets</span>
              </div>
              {tweets.map((t, i) => (
                <motion.div key={t.tweet_id} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.01 }}
                  className="glass-panel p-3.5 rounded-xl border border-white/5 hover:border-blue-500/20 transition-all">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{t.tweet_text}</p>
                  <div className="flex gap-3 mt-2 text-[10px] text-gray-500 font-semibold">
                    <span className="uppercase">{t.source_value || "manual"}</span>
                    <span>·</span>
                    <span>{t.created_at?.slice(0, 10)}</span>
                    {t.priority && <span className="text-purple-400">Priority {t.priority}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
