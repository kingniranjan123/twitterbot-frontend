"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, RefreshCw, History, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API}/api/schedule/today`);
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await fetch(`${API}/api/schedule/regenerate`, { method: "POST" });
      await fetchSchedules();
    } catch (e) { console.error(e); }
    finally { setRegenerating(false); }
  };

  const toggleExpand = async (twitter_id) => {
    if (expanded === twitter_id) { setExpanded(null); return; }
    setExpanded(twitter_id);
    if (!history[twitter_id]) {
      setHistoryLoading(prev => ({ ...prev, [twitter_id]: true }));
      try {
        const res = await fetch(`${API}/api/schedule/history/${twitter_id}`);
        const data = await res.json();
        setHistory(prev => ({ ...prev, [twitter_id]: data }));
      } catch (e) { console.error(e); }
      finally { setHistoryLoading(prev => ({ ...prev, [twitter_id]: false })); }
    }
  };

  const StatusBadge = ({ status }) => {
    const map = { posted: "text-green-400 bg-green-400/10", failed: "text-red-400 bg-red-400/10", skipped: "text-yellow-400 bg-yellow-400/10" };
    return <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${map[status] || map.posted}`}>{status || "posted"}</span>;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
      <header className="flex justify-between items-center mb-10">
        <div>
          <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
            <CalendarClock size={36} className="text-cyan-400" /> Scheduler
          </motion.h1>
          <p className="text-gray-400 mt-2">Today's smart anti-bot posting schedule for all active accounts</p>
        </div>
        <button onClick={handleRegenerate} disabled={regenerating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-cyan-600/20 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/50 transition-all disabled:opacity-50">
          <RefreshCw size={18} className={regenerating ? "animate-spin" : ""} /> Regenerate All
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" /></div>
      ) : schedules.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center text-gray-400">
          <CalendarClock size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No Schedules for Today</h3>
          <p className="mb-6">Click "Regenerate All" to generate today's posting schedule for all active accounts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((acc, i) => {
            const times = acc.scheduled_times ? acc.scheduled_times.split(",").map(t => t.trim()) : [];
            const isExpanded = expanded === acc.twitter_id;
            const hist = history[acc.twitter_id];
            return (
              <motion.div key={acc.twitter_id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="glass-panel rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={() => toggleExpand(acc.twitter_id)}>
                  <div className="flex items-center gap-4">
                    <img src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="avatar" className="w-12 h-12 rounded-full border-2 border-cyan-500/30" />
                    <div>
                      <p className="font-bold text-white text-lg">@{acc.username}</p>
                      <p className="text-xs text-gray-500 font-mono">{acc.twitter_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {times.length > 0 ? times.map((t, idx) => (
                      <span key={idx} className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-bold px-3 py-1 rounded-full">
                        <Clock size={14} /> {t}
                      </span>
                    )) : <span className="text-gray-500 text-sm italic">No times scheduled</span>}
                    <span className="ml-4 text-gray-400">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 overflow-hidden">
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2"><History size={14} /> 7-Day Post History</h4>
                          {historyLoading[acc.twitter_id] ? (
                            <div className="animate-pulse text-gray-500 text-sm">Loading history...</div>
                          ) : hist?.post_history?.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {hist.post_history.map((p, idx) => (
                                <div key={idx} className="p-2 bg-white/5 rounded-lg text-xs">
                                  <div className="flex items-center gap-2 mb-1">
                                    {p.status === "failed" ? <XCircle size={12} className="text-red-400" /> : <CheckCircle2 size={12} className="text-green-400" />}
                                    <StatusBadge status={p.status} />
                                    <span className="text-gray-500">{p.created_at?.slice(0, 16)}</span>
                                  </div>
                                  <p className="text-gray-300 line-clamp-2">{p.tweet_text}</p>
                                  {p.failure_reason && <p className="text-red-400 mt-1">Reason: {p.failure_reason}</p>}
                                </div>
                              ))}
                            </div>
                          ) : <p className="text-gray-500 text-sm italic">No post history in last 7 days</p>}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2"><CalendarClock size={14} /> Schedule History</h4>
                          {hist?.schedule_history?.length > 0 ? (
                            <div className="space-y-2">
                              {hist.schedule_history.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-white/5 rounded-lg">
                                  <span className="text-gray-400 font-mono">{s.date}</span>
                                  <span className="text-cyan-300 text-xs">{s.scheduled_times}</span>
                                </div>
                              ))}
                            </div>
                          ) : <p className="text-gray-500 text-sm italic">No schedule history</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
