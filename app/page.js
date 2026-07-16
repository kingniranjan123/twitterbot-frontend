"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Activity, Play, Square, RefreshCw, Layers, Twitter, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    accounts: 0,
    tweets_detected: 0,
    tweets_posted: 0,
    active_threads: 0
  });
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Determine initial running state if possible, or assume stopped
    // Start stat simulation
    const interval = setInterval(() => {
      setStats(prev => ({
        accounts: 5,
        tweets_detected: prev.tweets_detected + (isRunning ? Math.floor(Math.random() * 3) : 0),
        tweets_posted: prev.tweets_posted + (isRunning && Math.random() > 0.8 ? 1 : 0),
        active_threads: isRunning ? 4 : 0
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/start-fetch`, { method: 'POST' });
      setIsRunning(true);
    } catch (e) {
      console.error("Start failed", e);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/stop-fetch`, { method: 'POST' }); 
      setIsRunning(false);
    } catch (e) { console.error(e) }
  };

  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const checkPostingStatus = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status-post`);
            if (response.ok) {
                const data = await response.json();
                setIsPosting(data.status === "running");
            }
        } catch (error) {
            console.error("Failed to fetch posting status:", error);
        }
    };
    checkPostingStatus();
  }, []);

  const startStopPosting = async () => {
      const endpoint = isPosting ? '/stop-post' : '/start-post';
      try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, { method: 'POST' });
          if (response.ok) {
              const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status-post`); 
              const statusData = await statusResponse.json();
              setIsPosting(statusData.status === "running");
          }
      } catch (e) {
          console.error("Failed to toggle posting", e);
      }
  };

  const cards = [
    { title: "Active Accounts", value: stats.accounts, icon: <Users size={24} />, color: "from-blue-500 to-cyan-400" },
    { title: "Extracted", value: stats.tweets_detected, icon: <Layers size={24} />, color: "from-purple-500 to-pink-500" },
    { title: "Posted", value: stats.tweets_posted, icon: <Twitter size={24} />, color: "from-green-400 to-emerald-600" },
    { title: "System Load", value: isRunning || isPosting ? "Optimal" : "Idle", icon: <Activity size={24} />, color: "from-orange-400 to-red-500" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
          >
            Nexus Dashboard
          </motion.h1>
          <p className="text-gray-400 mt-2">Real-time Twitter Automation Grid</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleStart}
            disabled={loading || isRunning}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:scanlines
                ${isRunning
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:scale-105 text-white shadow-blue-500/20'
              }`}
          >
            <Play size={20} fill="currentColor" /> {isRunning ? "System Active" : "Initialize System"}
          </button>

          {isRunning && (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/50 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all"
            >
              <Square size={20} fill="currentColor" /> Terminate
            </button>
          )}

          <button
              onClick={startStopPosting}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg 
                  ${isPosting
                  ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 text-white shadow-green-500/20'
                }`}
          >
              {isPosting ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              {isPosting ? "Stop Posting" : "Start Global Posting"}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all cursor-default"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${card.color} opacity-20 rounded-full blur-xl group-hover:opacity-40 transition-opacity`} />
            <div className="relative z-10">
              <div className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
                {card.icon} {card.title}
              </div>
              <div className="text-4xl font-bold text-white tracking-tight">
                {card.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="col-span-2 glass-panel rounded-2xl p-6 min-h-[400px]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-200">
            <Activity className="text-purple-400" /> Neural Activity Feed
          </h3>
          <div className="space-y-4">
            {/* Simulated Logs - In real app, map through fetched logs */}
            {isRunning ? (
              [1, 2, 3].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex gap-4 items-start p-3 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors"
                >
                  <span className="text-xs font-mono text-gray-500 mt-1">10:{45 + i}:00</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {i === 0 ? "Scheduler initialized batch process for Slot 2" :
                        i === 1 ? "Extracted 15 tweets from target @elonmusk" :
                          "Generating AI response using GPT-4o model..."}
                    </p>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${i === 2 ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                      {i === 2 ? "PROCESSING" : "SUCCESS"}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-10 italic">System offline. Waiting for initialization...</div>
            )}
          </div>
        </div>

        {/* Quick Actions / System Status */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-pink-200">
            <RefreshCw className="text-pink-400" /> System Status
          </h3>
          <div className="space-y-6">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-200 bg-purple-900/50">
                  CPU Usage
                </span>
                <span className="text-right text-xs font-semibold inline-block text-purple-200">
                  {isRunning ? "48%" : "5%"}
                </span>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-900/20">
                <motion.div
                  animate={{ width: isRunning ? "48%" : "5%" }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                />
              </div>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-pink-200 bg-pink-900/50">
                  API Rate Limits
                </span>
                <span className="text-right text-xs font-semibold inline-block text-pink-200">
                  85% Free
                </span>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-pink-900/20">
                <div style={{ width: "15%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
