"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileUp, CheckSquare, XSquare, Calendar } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_DOT = { active: "bg-green-500", paused: "bg-yellow-400", held: "bg-red-500" };

export default function PostedTweetsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [days, setDays] = useState([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayTweets, setDayTweets] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API}/tweets/posted/summary`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const selectAccount = async (acc) => {
    setSelected(acc);
    setSelectedDay(null);
    setDayTweets([]);
    setDaysLoading(true);
    try {
      const res = await fetch(`${API}/tweets/posted/${acc.user_id}/by-day`);
      const data = await res.json();
      setDays(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setDaysLoading(false); }
  };

  const selectDay = async (date) => {
    setSelectedDay(date);
    setDayLoading(true);
    try {
      const res = await fetch(`${API}/tweets/posted/${selected.user_id}/on-date?date=${date}`);
      const data = await res.json();
      setDayTweets(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setDayLoading(false); }
  };

  const StatusIcon = ({ status }) => {
    if (status === "failed") return <XSquare size={14} className="text-red-400 flex-shrink-0" />;
    return <CheckSquare size={14} className="text-green-400 flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <div className="px-7 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileUp size={20} className="text-green-400" /> Posted Tweets
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Browse posted tweets by account and day</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row h-[calc(100vh-80px)] overflow-hidden">
        {/* Left: Accounts */}
        <div className="w-full xl:w-64 flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 bg-white/[0.01]">
          {loading ? <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-b-2 border-green-500 rounded-full" /></div> : (
            <div className="space-y-1.5">
              {accounts.map((acc, i) => (
                <motion.div key={acc.twitter_id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.02 }}
                  onClick={() => selectAccount(acc)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all border flex items-center gap-2.5 ${selected?.twitter_id === acc.twitter_id ? "border-green-500/50 bg-green-500/10" : "border-transparent hover:bg-white/5"}`}>
                  <div className="relative flex-shrink-0">
                    <img src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--background)] ${STATUS_DOT[acc.account_status] || "bg-gray-500"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">@{acc.username}</p>
                    <p className="text-[10px] text-gray-400">{acc.posted_count || 0} posts</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Middle: Days */}
        <div className="w-full xl:w-56 flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 bg-white/[0.01]">
          {!selected ? (
            <div className="text-center text-gray-500 text-xs mt-10">← Select an account</div>
          ) : daysLoading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-5 w-5 border-b-2 border-green-500 rounded-full" /></div>
          ) : days.length === 0 ? (
            <div className="text-center text-gray-500 text-xs mt-10">No posts found</div>
          ) : (
            <div className="space-y-1">
              {days.map((d, i) => (
                <motion.div key={d.date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  onClick={() => selectDay(d.date)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-all ${selectedDay === d.date ? "border-green-500/50 bg-green-500/10" : "border-transparent hover:bg-white/5"}`}>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-green-400 opacity-70" />
                    <span className="font-mono text-xs font-semibold text-white">{d.date}</span>
                  </div>
                  <span className="bg-white/5 text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded">{d.count}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Posts Detail */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!selectedDay ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <FileUp size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Select a date to view posts.</p>
            </div>
          ) : dayLoading ? (
            <div className="h-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-green-500 rounded-full" /></div>
          ) : dayTweets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">No tweets found for this day.</div>
          ) : (
            <div className="space-y-2.5 max-w-3xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-green-400" />
                Posts on {selectedDay}
              </h3>
              {dayTweets.map((t, i) => (
                <motion.div key={t.id} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="glass-panel p-3.5 rounded-xl border border-white/5 hover:border-green-500/20 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><StatusIcon status={t.status} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{t.tweet_text}</p>
                      <div className="flex flex-wrap gap-2.5 mt-2 text-[10px] font-semibold uppercase tracking-wider">
                        <span className="text-gray-500">{t.created_at?.slice(11, 16)}</span>
                        <span className={t.status === "failed" ? "text-red-400" : "text-green-400"}>{t.status || "posted"}</span>
                        {t.failure_reason && <span className="text-red-400 truncate lowercase normal-case">({t.failure_reason})</span>}
                      </div>
                    </div>
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
