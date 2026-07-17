"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, RefreshCw, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, History } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingAccount, setRegeneratingAccount] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API}/api/schedule/today`);
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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

  const handleRegenerateAccount = async (e, twitter_id) => {
    e.stopPropagation();
    setRegeneratingAccount(prev => ({ ...prev, [twitter_id]: true }));
    try {
      await fetch(`${API}/api/schedule/account/${twitter_id}/regenerate`, { method: "POST" });
      await fetchSchedules();
    } catch (e) { console.error(e); }
    finally { setRegeneratingAccount(prev => ({ ...prev, [twitter_id]: false })); }
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

  const statusDot = { active: "bg-green-500", paused: "bg-yellow-400", held: "bg-red-500", unknown: "bg-gray-500" };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <div className="px-7 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarClock size={20} className="text-cyan-400" /> Scheduler
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Today's anti-bot posting schedule per account</p>
        </div>
        <button onClick={handleRegenerate} disabled={regenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/15 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-all disabled:opacity-50">
          <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
          {regenerating ? "Regenerating..." : "Regenerate All"}
        </button>
      </div>

      <div className="p-7">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-b-2 border-cyan-500 rounded-full" /></div>
        ) : schedules.length === 0 ? (
          <div className="glass-panel rounded-xl p-10 text-center text-gray-500">
            <CalendarClock size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-white mb-1">No schedules yet</p>
            <p className="text-xs mb-4">Click Regenerate All to generate today's schedule at 00:01.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((acc, i) => {
              const times = acc.scheduled_times ? acc.scheduled_times.split(",").map(t => t.trim()) : [];
              const isExpanded = expanded === acc.twitter_id;
              const hist = history[acc.twitter_id];
              return (
                <motion.div key={acc.twitter_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-panel rounded-xl border border-white/5 hover:border-cyan-500/20 overflow-hidden transition-all">
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleExpand(acc.twitter_id)}>
                    <div className="relative flex-shrink-0">
                      <img src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--background)] ${statusDot[acc.account_status] || "bg-gray-500"}`} />
                    </div>
                    <p className="text-sm font-semibold text-white w-36 flex-shrink-0">@{acc.username}</p>
                    <div className="flex gap-2 flex-1 flex-wrap">
                      {times.length > 0 ? times.map((t, idx) => (
                        <span key={idx} className="flex items-center gap-1 text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                          <Clock size={10} /> {t}
                        </span>
                      )) : <span className="text-xs text-gray-600 italic">No times scheduled</span>}
                    </div>
                    <button onClick={(e) => handleRegenerateAccount(e, acc.twitter_id)} disabled={regeneratingAccount[acc.twitter_id]}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/15 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-all disabled:opacity-50">
                      <RefreshCw size={12} className={regeneratingAccount[acc.twitter_id] ? "animate-spin" : ""} />
                      {regeneratingAccount[acc.twitter_id] ? "Rescheduling..." : "Reschedule"}
                    </button>
                    <div className="flex-shrink-0 text-gray-500 hover:text-white transition-colors ml-2">
                      <span className="text-gray-600">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                    </div>
                  </div>

                  {/* Expanded history */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 overflow-hidden">
                        <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><History size={11} /> Post History (7 days)</h4>
                            {historyLoading[acc.twitter_id] ? (
                              <p className="text-xs text-gray-600">Loading...</p>
                            ) : hist?.post_history?.length > 0 ? (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {hist.post_history.map((p, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs p-2 bg-white/3 rounded-lg">
                                    {p.status === "failed" ? <XCircle size={11} className="text-red-400 mt-0.5 flex-shrink-0" /> : <CheckCircle2 size={11} className="text-green-400 mt-0.5 flex-shrink-0" />}
                                    <div>
                                      <span className="text-gray-500">{p.created_at?.slice(0, 16)}</span>
                                      <p className="text-gray-300 line-clamp-1 mt-0.5">{p.tweet_text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-xs text-gray-600 italic">No posts in last 7 days</p>}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><CalendarClock size={11} /> Schedule History</h4>
                            {hist?.schedule_history?.length > 0 ? (
                              <div className="space-y-1.5">
                                {hist.schedule_history.map((s, idx) => (
                                  <div key={idx} className="flex items-center gap-3 text-xs p-2 bg-white/3 rounded-lg">
                                    <span className="text-gray-500 font-mono w-24 flex-shrink-0">{s.date}</span>
                                    <span className="text-cyan-400">{s.scheduled_times}</span>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-xs text-gray-600 italic">No schedule history</p>}
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
    </div>
  );
}
