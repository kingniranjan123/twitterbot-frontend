"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileUp, CheckSquare, XSquare, Calendar } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

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

  const statusColor = { active: "bg-green-500", paused: "bg-yellow-500", held: "bg-red-500" };

  const StatusIcon = ({ status }) => {
    if (status === "failed") return <XSquare size={16} className="text-red-400 flex-shrink-0" />;
    return <CheckSquare size={16} className="text-green-400 flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
      <header className="mb-10">
        <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="text-4xl font-extrabold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent flex items-center gap-3">
          <FileUp size={36} className="text-green-400" /> Posted Tweets
        </motion.h1>
        <p className="text-gray-400 mt-2">Browse posted tweets by account and day</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Column 1: Accounts */}
        <div className="xl:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Accounts</h3>
          {loading ? <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-b-2 border-green-500 rounded-full" /></div> : (
            <div className="space-y-2">
              {accounts.map((acc, i) => (
                <motion.div key={acc.twitter_id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => selectAccount(acc)}
                  className={`glass-panel p-4 rounded-xl cursor-pointer transition-all hover:border-green-500/40 ${selected?.twitter_id === acc.twitter_id ? "border-green-500/60 bg-green-500/5" : "border-white/5"}`}>
                  <div className="flex items-center gap-3">
                    <img src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="avatar" className="w-10 h-10 rounded-full border border-green-500/30" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">@{acc.username}</p>
                        <span className={`w-2 h-2 rounded-full ${statusColor[acc.account_status] || "bg-gray-500"}`} />
                      </div>
                      <p className="text-xs text-gray-400">{acc.posted_count || 0} posts total</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Days Calendar */}
        <div className="xl:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            {selected ? `Days posted — @${selected.username}` : "Select account"}
          </h3>
          {!selected ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-gray-500 text-sm">← Select an account</div>
          ) : daysLoading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-b-2 border-green-500 rounded-full" /></div>
          ) : days.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-gray-500 text-sm">No posts found</div>
          ) : (
            <div className="space-y-2">
              {days.map((d, i) => (
                <motion.div key={d.date} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => selectDay(d.date)}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all hover:border-green-500/40 ${selectedDay === d.date ? "border-green-500/60 bg-green-500/5 glass-panel" : "glass-panel border-white/5"}`}>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-green-400" />
                    <span className="font-mono text-sm text-white">{d.date}</span>
                  </div>
                  <span className="bg-green-500/20 text-green-300 text-xs font-bold px-2.5 py-1 rounded-full">{d.count} post{d.count > 1 ? "s" : ""}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3+4: Day Detail */}
        <div className="xl:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            {selectedDay ? `Posts on ${selectedDay}` : "Select a day to view posts"}
          </h3>
          {!selectedDay ? (
            <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">
              <FileUp size={40} className="mx-auto mb-3 opacity-30" />
              <p>Click a date to view what was posted that day.</p>
            </div>
          ) : dayLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-10 w-10 border-b-2 border-green-500 rounded-full" /></div>
          ) : dayTweets.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">No tweets found for this day.</div>
          ) : (
            <div className="space-y-3">
              {dayTweets.map((t, i) => (
                <motion.div key={t.id} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="glass-panel p-5 rounded-xl border border-white/5 hover:border-green-500/20 transition-all">
                  <div className="flex items-start gap-3">
                    <StatusIcon status={t.status} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-200 leading-relaxed">{t.tweet_text}</p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-gray-500">{t.created_at?.slice(11, 16)}</span>
                        <span className={`font-bold ${t.status === "failed" ? "text-red-400" : "text-green-400"}`}>{t.status || "posted"}</span>
                        {t.failure_reason && <span className="text-red-400 truncate">Reason: {t.failure_reason}</span>}
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
