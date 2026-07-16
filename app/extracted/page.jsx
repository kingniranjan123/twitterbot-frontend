"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileDown, Trash2, UploadCloud, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

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

  const statusColor = { active: "bg-green-500", paused: "bg-yellow-500", held: "bg-red-500" };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
      {/* Toast */}
      {toast && (
        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
          className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-2 ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
          {toast.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {toast.msg}
        </motion.div>
      )}

      {/* Clear All Confirm Modal */}
      {clearAllConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel p-8 rounded-2xl max-w-md w-full border border-red-500/40">
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle className="text-red-400" /> Confirm Clear All</h2>
            <p className="text-gray-400 mb-6">This will permanently delete ALL extracted tweets across ALL accounts. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleClearAll} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">Yes, Delete All</button>
              <button onClick={() => setClearAllConfirm(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <FileDown size={36} className="text-blue-400" /> Extracted Tweets
          </motion.h1>
          <p className="text-gray-400 mt-1">View, manage, upload and clear collected tweets per account</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleGlobalExtract} disabled={globalExtracting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/50 transition-all disabled:opacity-50">
            <RefreshCw size={18} className={globalExtracting ? "animate-spin" : ""} /> {globalExtracting ? "Extracting..." : "Extract All"}
          </button>
          <button onClick={() => setClearAllConfirm(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-red-600/10 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition-all">
            <Trash2 size={18} /> Clear All Historical
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Account Grid */}
        <div className="xl:col-span-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Accounts</h3>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc, i) => (
                <motion.div key={acc.twitter_id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => selectAccount(acc)}
                  className={`glass-panel p-4 rounded-xl cursor-pointer transition-all hover:border-blue-500/40 ${selected?.twitter_id === acc.twitter_id ? "border-blue-500/60 bg-blue-500/5" : "border-white/5"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="avatar" className="w-10 h-10 rounded-full border border-blue-500/30" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">@{acc.username}</p>
                        <span className={`w-2 h-2 rounded-full ${statusColor[acc.account_status] || "bg-gray-500"}`} />
                      </div>
                      <p className="text-xs text-gray-400">{acc.tweet_count || 0} tweets extracted</p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleExtract(acc.twitter_id)} disabled={extracting[acc.twitter_id]}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all disabled:opacity-50 font-bold">
                      {extracting[acc.twitter_id] ? "..." : "Extract"}
                    </button>
                    <button onClick={() => fileRefs.current[acc.user_id]?.click()} disabled={uploading[acc.user_id]}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all disabled:opacity-50 font-bold flex items-center justify-center gap-1">
                      <UploadCloud size={12} /> {uploading[acc.user_id] ? "..." : "Upload"}
                    </button>
                    <input type="file" accept=".xlsx,.csv" className="hidden" ref={el => fileRefs.current[acc.user_id] = el}
                      onChange={e => handleUpload(acc.user_id, acc.twitter_id, e)} />
                    <button onClick={() => handleClear(acc.user_id, acc.username)} disabled={clearing[acc.user_id]}
                      className="text-xs py-1.5 px-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/20 transition-all disabled:opacity-50">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Tweet List */}
        <div className="xl:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
            {selected ? `Extracted Tweets — @${selected.username}` : "Select an account to view tweets"}
          </h3>
          {!selected ? (
            <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">
              <FileDown size={40} className="mx-auto mb-3 opacity-30" />
              <p>Click an account on the left to view its extracted tweets.</p>
            </div>
          ) : tweetsLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>
          ) : tweets.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">No extracted tweets for this account.</div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {tweets.map((t, i) => (
                <motion.div key={t.tweet_id} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="glass-panel p-4 rounded-xl border border-white/5 hover:border-blue-500/20 transition-all">
                  <p className="text-sm text-gray-200 leading-relaxed">{t.tweet_text}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>{t.source_value || "manual"}</span>
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
